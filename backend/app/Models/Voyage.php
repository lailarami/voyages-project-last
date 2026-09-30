<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voyage extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'titre', 'destination', 'pays', 'description', 'description_longue',
        'prix', 'prix_ancien', 'date_depart', 'date_retour',
        'places_disponibles', 'places_totales', 'categorie',
        'image', 'images_gallery', 'video_url', 'fournisseur_id',
        'inclus', 'non_inclus', 'programme', 'niveau_difficulte',
        'langue', 'featured', 'is_active', 'devise',
        'code_promo', 'reduction', 'vues',
    ];

    protected $casts = [
        'date_depart' => 'date',
        'date_retour' => 'date',
        'images_gallery' => 'array',
        'inclus' => 'array',
        'non_inclus' => 'array',
        'programme' => 'array',
        'featured' => 'boolean',
        'is_active' => 'boolean',
        'prix' => 'decimal:2',
        'prix_ancien' => 'decimal:2',
    ];

    // Relations
    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function avis(): HasMany
    {
        return $this->hasMany(Avis::class)->where('approuve', true);
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    // Attributes
    public function getMoyenneNotesAttribute(): float
    {
        return round($this->avis()->avg('note') ?? 0, 1);
    }

    public function getNombreAvisAttribute(): int
    {
        return $this->avis()->count();
    }

    public function getDureeAttribute(): int
    {
        return $this->date_depart->diffInDays($this->date_retour) + 1;
    }

    public function getIsDisponibleAttribute(): bool
    {
        return $this->places_disponibles > 0 && $this->is_active;
    }

    public function getPrixFinalAttribute(): float
    {
        if ($this->reduction > 0) {
            return $this->prix * (1 - $this->reduction / 100);
        }
        return $this->prix;
    }

    // Scopes
    public function scopeActif($query) { return $query->where('is_active', true); }
    public function scopeFeatured($query) { return $query->where('featured', true); }
    public function scopeDisponible($query) { return $query->where('places_disponibles', '>', 0); }
    public function scopeByCategorie($query, string $categorie) { return $query->where('categorie', $categorie); }
    public function scopeByDestination($query, string $dest) {
        return $query->where('destination', 'like', "%{$dest}%")
                     ->orWhere('pays', 'like', "%{$dest}%");
    }
    public function scopePrixEntre($query, float $min, float $max) {
        return $query->whereBetween('prix', [$min, $max]);
    }

    // Increment views
    public function incrementVues(): void
    {
        $this->increment('vues');
    }
}
