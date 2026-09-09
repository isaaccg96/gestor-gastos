<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\User;
use App\Models\Expense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'amount' => $this->faker->randomFloat(2, 5, 200),
            'description' => $this->faker->sentence(3),
            'date' => $this->faker->dateTimeThisYear(),
            'user_id' => User::factory(),
            'category_id' => Category::factory(),
        ];
    }
}
