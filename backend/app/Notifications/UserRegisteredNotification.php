<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class UserRegisteredNotification extends Notification
{
    protected User $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Bienvenue sur Voyages Organisés')
            ->greeting('Bonjour ' . $this->user->prenom . ',')
            ->line('Votre compte a bien été créé.')
            ->line('Vous pouvez maintenant réserver des voyages et suivre vos réservations depuis votre compte.')
            ->action('Accéder à Voyages Organisés', config('app.url'))
            ->line('Merci de nous avoir rejoint !');
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => 'Inscription réussie',
            'message' => 'Bienvenue sur Voyages Organisés. Votre compte a été créé avec succès.',
        ];
    }
}
