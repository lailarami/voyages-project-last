<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TicketReponse;
use App\Models\TicketSupport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = TicketSupport::with(['user', 'assignedTo', 'reponses.user']);

        if ($user->isClient()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isSupport()) {
            $query->where(fn($q) => $q->where('assigned_to', $user->id)->orWhereNull('assigned_to'));
        }

        if ($request->has('statut'))   $query->where('statut', $request->statut);
        if ($request->has('priorite')) $query->where('priorite', $request->priorite);
        if ($request->has('search') && trim($request->search) !== '') {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('sujet', 'like', $search)
                  ->orWhere('message', 'like', $search)
                  ->orWhere('numero_ticket', 'like', $search);
            });
        }

        $tickets = $query->orderBy('created_at', 'desc')->paginate(15);
        return response()->json([
            'success' => true,
            'data'    => $tickets->map(fn($t) => $this->formatTicket($t)),
            'meta'    => ['total' => $tickets->total()],
        ]);
    }

    public function myTickets(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = TicketSupport::with(['user', 'assignedTo', 'reponses.user'])
            ->where('user_id', $user->id);

        if ($request->has('statut'))   $query->where('statut', $request->statut);
        if ($request->has('priorite')) $query->where('priorite', $request->priorite);
        if ($request->has('search') && trim($request->search) !== '') {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('sujet', 'like', $search)
                  ->orWhere('message', 'like', $search)
                  ->orWhere('numero_ticket', 'like', $search);
            });
        }

        $tickets = $query->orderBy('created_at', 'desc')->paginate(15);
        return response()->json([
            'success' => true,
            'data'    => $tickets->map(fn($t) => $this->formatTicket($t)),
            'meta'    => ['total' => $tickets->total()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'sujet'        => 'required|string|max:255',
            'message'      => 'required|string|min:10',
            'categorie'    => 'nullable|string',
            'priorite'     => 'nullable|in:faible,normale,haute,urgente',
            'reservation_id' => 'nullable|exists:reservations,id',
        ]);

        if ($validator->fails()) return response()->json(['success' => false, 'errors' => $validator->errors()], 422);

        $ticket = TicketSupport::create([
            'user_id'        => Auth::id(),
            'sujet'          => $request->sujet,
            'message'        => $request->message,
            'categorie'      => $request->categorie,
            'priorite'       => $request->get('priorite', 'normale'),
            'reservation_id' => $request->reservation_id,
            'statut'         => 'ouvert',
        ]);

        return response()->json(['success' => true, 'message' => 'Ticket créé !', 'data' => $this->formatTicket($ticket)], 201);
    }

    public function show(int $id): JsonResponse
    {
        $ticket = TicketSupport::with(['user', 'reponses.user'])->findOrFail($id);
        $user = Auth::user();
        
        // Mark as read when client views the ticket
        if ($user->isClient() && $user->id === $ticket->user_id) {
            $ticket->update(['has_unread_responses' => false]);
        }
        
        return response()->json(['success' => true, 'data' => $this->formatTicket($ticket, true)]);
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $request->validate(['message' => 'required|string|min:2']);
        $ticket = TicketSupport::findOrFail($id);

        $user = Auth::user();
        $isStaff = in_array($user->role, ['admin', 'support']);
        $reponse = TicketReponse::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $user->id,
            'message'   => $request->message,
            'is_staff'  => $isStaff,
        ]);

        // Mark unread for client if support replied
        if ($isStaff && $ticket->user_id !== $user->id) {
            $ticket->update(['has_unread_responses' => true]);

            // Notify ticket owner by mail + database notification
            try {
                if ($ticket->user && $ticket->user->email) {
                    $ticket->user->notify(new \App\Notifications\TicketReplyNotification($ticket, $reponse));
                }
            } catch (\Throwable $e) {
                Log::error('Ticket reply notification failed', [
                    'ticket_id' => $ticket->id,
                    'user_id' => $ticket->user_id,
                    'email' => $ticket->user?->email,
                    'error' => $e->getMessage(),
                ]);
            }
        }


        if ($ticket->statut === 'ouvert') {
            $ticket->update(['statut' => 'en_cours', 'assigned_to' => $user->isSupport() ? $user->id : $ticket->assigned_to]);
        }

        // If client replied, notify assigned support or all support users
        if (!$isStaff) {
            try {
                if ($ticket->assignedTo) {
                    $ticket->assignedTo->notify(new \App\Notifications\TicketReplyNotification($ticket, $reponse));
                } else {
                    \App\Models\User::where('role', 'support')->get()->each(function ($support) use ($ticket, $reponse) {
                        $support->notify(new \App\Notifications\TicketReplyNotification($ticket, $reponse));
                    });
                }
            } catch (\Throwable $e) {
                Log::error('Ticket reply notification to support failed', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Réponse envoyée.', 'data' => $reponse]);
    }

    /**
     * Support dashboard statistics (today count + tickets per day)
     */
    public function dashboardSupport(Request $request): JsonResponse
    {
        $days = (int) $request->get('days', 14);

        $todayCount = TicketSupport::whereDate('created_at', now()->toDateString())->count();

        $ticketsByDay = TicketSupport::selectRaw('DATE(created_at) as date, COUNT(*) as total')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $statusCounts = [
            'total' => TicketSupport::count(),
            'ouvert' => TicketSupport::ouvert()->count(),
            'en_cours' => TicketSupport::enCours()->count(),
            'resolu' => TicketSupport::where('statut', 'resolu')->count(),
        ];

        return response()->json(['success' => true, 'data' => [
            'today_count' => $todayCount,
            'tickets_by_day' => $ticketsByDay,
            'status_counts' => $statusCounts,
        ]]);
    }

    public function close(int $id): JsonResponse
    {
        $ticket = TicketSupport::findOrFail($id);
        $ticket->update(['statut' => 'resolu', 'date_resolution' => now()]);
        return response()->json(['success' => true, 'message' => 'Ticket résolu.']);
    }

    public function assign(int $id): JsonResponse
    {
        $ticket = TicketSupport::findOrFail($id);
        $user = Auth::user();
        $ticket->update(['statut' => 'en_cours', 'assigned_to' => $user->id]);
        return response()->json(['success' => true, 'message' => 'Ticket assigné et marqué en cours.']);
    }

    public function destroy(int $id): JsonResponse
    {
        $ticket = TicketSupport::findOrFail($id);
        $ticket->delete();
        return response()->json(['success' => true, 'message' => 'Ticket supprimé.']);
    }

    private function formatTicket(TicketSupport $t, bool $withReplies = false): array
    {
        $lastReply = $t->reponses()->orderByDesc('created_at')->first();
        $data = [
            'id'       => $t->id,
            'numero'   => $t->numero_ticket,
            'sujet'    => $t->sujet,
            'message'  => $t->message,
            'statut'   => $t->statut,
            'priorite' => $t->priorite,
            'categorie' => $t->categorie,
            'user'     => $t->user ? ['id' => $t->user->id, 'nom' => $t->user->full_name] : null,
            'assigned_to' => $t->assignedTo ? $t->assignedTo->full_name : null,
            'created_at' => $t->created_at->format('d/m/Y H:i'),
            'reponses_count' => $t->reponses()->count(),
            'last_reply_date' => $lastReply ? $lastReply->created_at->format('d/m/Y H:i') : null,
            'last_reply_is_staff' => $lastReply ? (bool)$lastReply->is_staff : false,
            'last_reply_user' => $lastReply && $lastReply->user ? $lastReply->user->full_name : null,
            'has_unread_responses' => (bool)$t->has_unread_responses,
        ];

        if ($withReplies) {
            $data['reponses'] = $t->reponses->map(fn($r) => [
                'id'       => $r->id,
                'message'  => $r->message,
                'is_staff' => $r->is_staff,
                'user'     => $r->user?->full_name,
                'date'     => $r->created_at->format('d/m/Y H:i'),
            ]);
        }

        return $data;
    }
}
