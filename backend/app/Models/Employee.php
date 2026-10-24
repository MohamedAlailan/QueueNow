<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Employee extends Authenticatable
{
    use HasApiTokens;

    protected $hidden = ['password'];

    protected $casts = ['password' => 'hashed', 'is_available' => 'boolean'];

    protected $fillable = ['name', 'service_id', 'role', 'email', 'password', 'is_available'];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
