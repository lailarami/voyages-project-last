<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reservation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'numero_reservation', 'user_id', 'voyage_id', 'nombre_places',
        'statut', 'montant_total', 'montant_paye', 'voyageurs',
        'notes', 'code_qr', 'date_confirmation', 'date_annulation', 'motif_annulation',
        'places_committed',
    ];

    protected $casts = [
        'voyageurs' => 'array',
        'date_confirmation' => 'datetime',
        'date_annulation' => 'datetime',
        'montant_total' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'places_committed' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($reservation) {
            $reservation->numero_reservation = 'REZ-' . date('Y') . '-' . strtoupper(uniqid());
        });
    }

    // Relations
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function voyage(): BelongsTo { return $this->belongsTo(Voyage::class); }
    public function paiement(): HasOne { return $this->hasOne(Paiement::class); }
    public function ticket(): HasOne { return $this->hasOne(TicketSupport::class); }

    // Scopes
    public function scopeByStatut($query, string $statut) { return $query->where('statut', $statut); }
    public function scopeConfirmee($query) { return $query->where('statut', 'confirmee'); }
    public function scopeEnAttente($query) { return $query->where('statut', 'en_attente'); }

    // Helpers
    public function isPayee(): bool { return $this->montant_paye >= $this->montant_total; }
    public function resteAPayer(): float { return max(0, $this->montant_total - $this->montant_paye); }
}
