<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fournisseur extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'nom', 'email', 'telephone',
        'service', 'description', 'logo', 'site_web',
        'statut', 'commission',
    ];

    protected $casts = [
        'commission' => 'decimal:2',
    ];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function voyages(): HasMany { return $this->hasMany(Voyage::class); }

    public function scopeActif($query) { return $query->where('statut', 'actif'); }
}
