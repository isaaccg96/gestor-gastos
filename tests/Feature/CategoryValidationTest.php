<?php

use App\Models\User;

it('no permite crear una categoría sin nombre', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/categories', [
        'name' => '',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('name');
});

it('no permite un límite de presupuesto negativo', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/categories', [
        'name' => 'Ocio',
        'budget_limit' => -50,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('budget_limit');
});

it('permite crear una categoría sin límite de presupuesto', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/categories', [
        'name' => 'Ocio',
    ]);

    $response->assertStatus(201);
});

it('un usuario no autenticado no puede crear categorías', function () {
    $response = $this->postJson('/api/categories', [
        'name' => 'Ocio',
    ]);

    $response->assertStatus(401);
});
