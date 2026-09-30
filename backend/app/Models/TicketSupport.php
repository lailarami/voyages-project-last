<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketSupport extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tickets_support';

    protected $fillable = [
        'numero_ticket', 'user_id', 'assigned_to',
        'sujet', 'message', 'statut', 'priorite',
        'categorie', 'propriete', 'reservation_id', 'date_resolution', 'has_unread_responses',
    ];

    protected $casts = [
        'date_resolution' => 'datetime',
        'has_unread_responses' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($ticket) {
            $ticket->numero_ticket = 'TKT-' . date('Y') . '-' . strtoupper(uniqid());
        });
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function assignedTo(): BelongsTo { return $this->belongsTo(User::class, 'assigned_to'); }
    public function reservation(): BelongsTo { return $this->belongsTo(Reservation::class); }
    public function reponses(): HasMany { return $this->hasMany(TicketReponse::class, 'ticket_id'); }

    public function scopeOuvert($query) { return $query->where('statut', 'ouvert'); }
    public function scopeEnCours($query) { return $query->where('statut', 'en_cours'); }
    public function scopeUrgent($query) { return $query->where('priorite', 'urgente'); }
}

// Inline TicketReponse model (can be in separate file)
class TicketReponse extends Model
{
    use HasFactory;

    protected $table = 'ticket_reponses';

    protected $fillable = ['ticket_id', 'user_id', 'message', 'is_staff'];

    protected $casts = ['is_staff' => 'boolean'];

    public function ticket(): BelongsTo { return $this->belongsTo(TicketSupport::class, 'ticket_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
