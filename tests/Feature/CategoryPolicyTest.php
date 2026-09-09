<?php

use App\Models\Category;
use App\Models\User;

it('permite al dueño ver su propia categoría', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);

    expect($user->can('view', $category))->toBeTrue();
});

it('impide a otro usuario ver una categoría ajena', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $owner->id]);

    expect($otherUser->can('view', $category))->toBeFalse();
});

it('impide a otro usuario actualizar una categoría ajena', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $owner->id]);

    expect($otherUser->can('update', $category))->toBeFalse();
});

it('impide a otro usuario eliminar una categoría ajena', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $owner->id]);

    expect($otherUser->can('delete', $category))->toBeFalse();
});
