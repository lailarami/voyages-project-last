<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ReservationConfirmedNotification extends Notification
{

    protected Reservation $reservation;

    public function __construct(Reservation $reservation)
    {
        $this->reservation = $reservation;
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
        $destination = $this->reservation->voyage?->destination ?? 'votre destination';
        $title = $this->reservation->voyage?->titre ? "{$this->reservation->voyage->titre}" : 'votre voyage';
        $frontendUrl = env('FRONTEND_URL', config('app.url'));

        return (new MailMessage)
            ->subject("Votre réservation pour {$title} a été confirmée")
            ->greeting('Bonjour ' . ($notifiable->full_name ?? ''))
            ->line("Votre réservation #{$this->reservation->numero_reservation} pour {$title} a été confirmée.")
            ->line("Destination : {$destination}")
            ->line("Nombre de places : {$this->reservation->nombre_places}")
            ->line('Merci de votre confiance. Votre voyage est maintenant confirmé.')
            ->action('Voir ma réservation', $frontendUrl)
            ->line('À bientôt sur Voyages Organisés !');
    }

    public function toArray($notifiable)
    {
        return [
            'reservation_id' => $this->reservation->id,
            'numero' => $this->reservation->numero_reservation,
            'voyage' => $this->reservation->voyage?->titre,
            'message' => 'Votre réservation a été confirmée.',
        ];
    }
}
