<?php

use App\Models\Category;
use App\Models\Expense;
use App\Models\User;

it('calcula correctamente el total gastado por categoría', function () {
    $user = User::factory()->create();
    $comida = Category::factory()->create(['user_id' => $user->id, 'name' => 'Comida']);
    $transporte = Category::factory()->create(['user_id' => $user->id, 'name' => 'Transporte']);

    Expense::factory()->create([
        'user_id' => $user->id,
        'category_id' => $comida->id,
        'amount' => 20,
    ]);
    Expense::factory()->create([
        'user_id' => $user->id,
        'category_id' => $comida->id,
        'amount' => 30,
    ]);
    Expense::factory()->create([
        'user_id' => $user->id,
        'category_id' => $transporte->id,
        'amount' => 15,
    ]);

    $response = $this->actingAs($user)->getJson('/api/summary/by-category');

    $response->assertStatus(200);

    $comidaTotal = collect($response->json())
        ->firstWhere('category_id', $comida->id);

    expect((float) $comidaTotal['total'])->toBe(50.0);
});

it('solo incluye los gastos del usuario autenticado en el resumen', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $myCategory = Category::factory()->create(['user_id' => $user->id]);
    $otherCategory = Category::factory()->create(['user_id' => $otherUser->id]);

    Expense::factory()->create([
        'user_id' => $user->id,
        'category_id' => $myCategory->id,
        'amount' => 100,
    ]);
    Expense::factory()->create([
        'user_id' => $otherUser->id,
        'category_id' => $otherCategory->id,
        'amount' => 999,
    ]);

    $response = $this->actingAs($user)->getJson('/api/summary/by-category');

    $totals = collect($response->json())->pluck('total');

    expect($totals)->not->toContain('999.00');
});
