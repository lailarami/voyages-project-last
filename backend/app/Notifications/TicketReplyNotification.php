<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\TicketSupport;
use App\Models\TicketReponse;

class TicketReplyNotification extends Notification
{

    protected TicketSupport $ticket;
    protected TicketReponse $reponse;

    public function __construct(TicketSupport $ticket, TicketReponse $reponse)
    {
        $this->ticket = $ticket;
        $this->reponse = $reponse;
    }

    public function via($notifiable)
    {
        $channels = ['database'];

        if (!empty($notifiable->email)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail($notifiable)
    {
        $frontendUrl = env('FRONTEND_URL', config('app.url'));
        $subject = "Support a répondu à votre ticket {$this->ticket->numero_ticket}";

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Bonjour ' . ($notifiable->full_name ?? ''))
            ->line("Le support a répondu à votre ticket : {$this->ticket->sujet}.")
            ->line('Voici le message :')
            ->line($this->reponse->message)
            ->action('Voir le ticket', $frontendUrl)
            ->line('Merci de votre confiance.');
    }

    public function toArray($notifiable)
    {
        return [
            'ticket_id' => $this->ticket->id,
            'numero' => $this->ticket->numero_ticket,
            'sujet' => $this->ticket->sujet,
            'message' => $this->reponse->message,
            'is_staff' => (bool)$this->reponse->is_staff,
        ];
    }
}
