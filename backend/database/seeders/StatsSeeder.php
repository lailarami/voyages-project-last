<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use App\Models\User;
use App\Models\Voyage;
use App\Models\Reservation;
use App\Models\Paiement;
use App\Models\TicketSupport;
use App\Models\TicketReponse;

class StatsSeeder extends Seeder
{
    public function run(): void
    {
        if (Reservation::count() > 100 && TicketSupport::count() > 30) {
            $this->command->info('StatsSeeder skipped: enough fake data already present.');
            return;
        }

        $clients = User::where('role', 'client')->get();
        $support = User::where('role', 'support')->first();
        $voyages = Voyage::all();

        if ($clients->count() < 1 || !$support || $voyages->isEmpty()) {
            $this->command->warn('StatsSeeder requires at least 1 client, 1 support user, and voyages.');
            return;
        }

        // Add a few extra clients if needed
        while ($clients->count() < 8) {
            $index = $clients->count() + 1;
            $user = User::create([
                'nom' => "Client$index",
                'prenom' => 'Test',
                'email' => "client{$index}@voyages.ma",
                'password' => bcrypt('password'),
                'role' => 'client',
                'status' => 'actif',
                'telephone' => "+21266123456{$index}",
                'adresse' => 'Casablanca, Maroc',
            ]);
            $clients->push($user);
        }

        $statusWeights = [
            'confirmee' => 60,
            'en_attente' => 20,
            'annulee' => 10,
            'refusee' => 7,
            'terminee' => 3,
        ];

        $ticketStatuses = ['ouvert', 'en_cours', 'resolu', 'ferme'];
        $ticketPriorities = ['faible', 'normale', 'haute', 'urgente'];
        $ticketSubjects = [
            'Demande de modification de réservation',
            'Problème de paiement',
            'Question sur le programme du voyage',
            'Demande de facture',
            'Problème de connexion au compte',
            'Annulation de dernière minute',
            'Erreur lors de la réservation',
            'Question sur les documents nécessaires',
            'Besoin d’un service spécial',
        ];

        $reservationReasons = [
            'Voyage de groupe pour famille',
            'Séjour professionnel',
            'Vacances estivales',
            'Circuit aventure',
            'Voyage romantique',
            'Excursion culturelle',
        ];

        $clientsCount = $clients->count();
        $voyagesCount = $voyages->count();

        for ($days = 30; $days >= 1; $days--) {
            $date = Carbon::now()->subDays($days);
            $bookingsPerDay = rand(2, 5);

            for ($i = 0; $i < $bookingsPerDay; $i++) {
                $client = $clients->random();
                $voyage = $voyages->random();
                $places = rand(1, min(6, $voyage->places_totales));
                $statut = $this->pickWeightedStatus($statusWeights);
                $montantTotal = (float)$voyage->prix * $places;
                $montantPaye = 0;
                $dateConfirmation = null;
                $dateAnnulation = null;
                $motifAnnulation = null;

                if (in_array($statut, ['confirmee', 'terminee', 'remboursee'])) {
                    $montantPaye = $montantTotal;
                    $dateConfirmation = $date->copy()->addHours(rand(9, 18));
                }

                if ($statut === 'annulee' || $statut === 'refusee') {
                    $montantPaye = rand(0, 1) ? 0 : round($montantTotal * 0.3, 2);
                    $dateAnnulation = $date->copy()->addHours(rand(10, 20));
                    $motifAnnulation = Arr::random([
                        'Changement de programme',
                        'Problème de santé',
                        'Paiement refusé',
                        'Disponibilité du voyage limitée',
                    ]);
                }

                $reservation = Reservation::create([
                    'user_id' => $client->id,
                    'voyage_id' => $voyage->id,
                    'nombre_places' => $places,
                    'statut' => $statut,
                    'montant_total' => $montantTotal,
                    'montant_paye' => $montantPaye,
                    'voyageurs' => [
                        ['nom' => $client->nom, 'prenom' => $client->prenom],
                    ],
                    'notes' => Arr::random($reservationReasons),
                    'date_confirmation' => $dateConfirmation,
                    'date_annulation' => $dateAnnulation,
                    'motif_annulation' => $motifAnnulation,
                    'created_at' => $date->copy()->addMinutes(rand(5, 360)),
                    'updated_at' => $date->copy()->addMinutes(rand(5, 360)),
                ]);

                if (in_array($statut, ['confirmee', 'terminee', 'remboursee'])) {
                    Paiement::create([
                        'reservation_id' => $reservation->id,
                        'montant' => $montantTotal,
                        'devise' => 'MAD',
                        'methode' => Arr::random(['stripe', 'carte', 'virement', 'especes']),
                        'transaction_id' => 'PAY-' . strtoupper(uniqid()),
                        'statut' => $statut === 'remboursee' ? 'rembourse' : 'reussi',
                        'date_paiement' => $date->copy()->addHours(rand(10, 20)),
                        'created_at' => $date->copy()->addHours(rand(10, 20)),
                        'updated_at' => $date->copy()->addHours(rand(10, 20)),
                    ]);
                }
            }
        }

        for ($days = 14; $days >= 0; $days--) {
            $date = Carbon::now()->subDays($days);
            $ticketsPerDay = rand(1, 4);

            for ($i = 0; $i < $ticketsPerDay; $i++) {
                $client = $clients->random();
                $status = Arr::random($ticketStatuses);
                $priority = Arr::random($ticketPriorities);
                $assignedTo = rand(0, 1) ? $support->id : null;
                $hasUnread = $status === 'en_cours';

                $ticket = TicketSupport::create([
                    'user_id' => $client->id,
                    'assigned_to' => $assignedTo,
                    'sujet' => Arr::random($ticketSubjects),
                    'message' => 'Bonjour, ' . Arr::random([
                        'j’ai besoin de précisions sur le voyage.',
                        'je souhaite modifier ma réservation.',
                        'je n’ai pas reçu de confirmation.',
                        'je rencontre un problème de paiement.',
                        'je veux changer le nombre de personnes.',
                    ]),
                    'categorie' => Arr::random(['reservation', 'paiement', 'technique', 'annulation', 'autre']),
                    'priorite' => $priority,
                    'statut' => $status,
                    'reservation_id' => null,
                    'has_unread_responses' => $hasUnread,
                    'created_at' => $date->copy()->addMinutes(rand(30, 420)),
                    'updated_at' => $date->copy()->addMinutes(rand(30, 480)),
                ]);

                if ($status !== 'ouvert') {
                    TicketReponse::create([
                        'ticket_id' => $ticket->id,
                        'user_id' => $support->id,
                        'message' => 'Merci pour votre message, nous y travaillons actuellement.',
                        'is_staff' => true,
                        'created_at' => $date->copy()->addHours(rand(2, 8)),
                        'updated_at' => $date->copy()->addHours(rand(2, 8)),
                    ]);
                }

                if ($status === 'resolu' || $status === 'ferme') {
                    $ticket->update(['has_unread_responses' => false]);
                }
            }
        }

        $this->command->info('✅ Fake statistics data created for reservations and support tickets.');
    }

    private function pickWeightedStatus(array $weights): string
    {
        $sum = array_sum($weights);
        $roll = rand(1, $sum);
        $current = 0;

        foreach ($weights as $status => $weight) {
            $current += $weight;
            if ($roll <= $current) {
                return $status;
            }
        }

        return array_key_first($weights);
    }
}
