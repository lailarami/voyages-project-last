<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id', 'montant', 'devise', 'methode',
        'transaction_id', 'stripe_payment_intent_id', 'stripe_charge_id',
        'statut', 'stripe_data', 'facture_pdf', 'date_paiement',
    ];

    protected $casts = [
        'stripe_data' => 'array',
        'date_paiement' => 'datetime',
        'montant' => 'decimal:2',
    ];

    public function reservation(): BelongsTo { return $this->belongsTo(Reservation::class); }
}
