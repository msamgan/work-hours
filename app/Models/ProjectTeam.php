<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectTeam extends Model
{
    protected $table = 'project_team';

    protected $fillable = [
        'project_id',
        'member_id',
        'is_approver',
        'hourly_rate',
        'currency',
    ];
}
