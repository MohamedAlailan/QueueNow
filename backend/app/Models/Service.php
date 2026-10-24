<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $fillable = ['name', 'is_open', 'type', 'avg_service_time'];

    protected $casts = ['is_open' => 'boolean', 'avg_service_time' => 'float'];

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
