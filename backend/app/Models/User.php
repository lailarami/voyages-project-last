<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'nom', 'prenom', 'email', 'password',
        'telephone', 'adresse', 'role', 'avatar', 'status',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // JWT
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
        ];
    }

    // Helper: full name
    public function getFullNameAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }

    // Relations
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function avis(): HasMany
    {
        return $this->hasMany(Avis::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(TicketSupport::class);
    }

    public function wishlist(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    public function fournisseur(): HasOne
    {
        return $this->hasOne(Fournisseur::class);
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('status', 'actif');
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    // Checks
    public function isAdmin(): bool { return $this->role === 'admin'; }
    public function isClient(): bool { return $this->role === 'client'; }
    public function isFournisseur(): bool { return $this->role === 'fournisseur'; }
    public function isSupport(): bool { return $this->role === 'support'; }
}
