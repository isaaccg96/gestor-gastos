<?php

use App\Models\Expense;
use App\Models\User;

it('permite al dueño ver su propio gasto', function () {
    $user = User::factory()->create();
    $expense = Expense::factory()->create(['user_id' => $user->id]);

    expect($user->can('view', $expense))->toBeTrue();
});

it('impide a otro usuario ver un gasto ajeno', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $expense = Expense::factory()->create(['user_id' => $owner->id]);

    expect($otherUser->can('view', $expense))->toBeFalse();
});

it('impide a otro usuario actualizar un gasto ajeno', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $expense = Expense::factory()->create(['user_id' => $owner->id]);

    expect($otherUser->can('update', $expense))->toBeFalse();
});

it('impide a otro usuario eliminar un gasto ajeno', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $expense = Expense::factory()->create(['user_id' => $owner->id]);

    expect($otherUser->can('delete', $expense))->toBeFalse();
});
