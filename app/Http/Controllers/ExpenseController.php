<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->expenses()->with('category')->latest('date')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date' => 'required|date',
            'category_id' => 'required|exists:categories,id',
        ]);

        return $request->user()->expenses()->create($validated);
    }

    public function show(Expense $expense)
    {
        return $expense->load('category');
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date' => 'required|date',
            'category_id' => 'required|exists:categories,id',
        ]);

        $expense->update($validated);

        return $expense->load('category');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return response()->noContent();
    }
}
