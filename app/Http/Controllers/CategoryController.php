<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()
            ->categories()
            ->withSum('expenses', 'amount')
            ->latest()
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'budget_limit' => 'nullable|numeric|min:0',
        ]);

        return $request->user()->categories()->create($validated);
    }

    public function show(Category $category)
    {
        $this->authorize('view', $category);

        return $category;
    }

    public function update(Request $request, Category $category)
    {
        $this->authorize('update', $category);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'budget_limit' => 'nullable|numeric|min:0',
        ]);

        $category->update($validated);

        return $category;
    }

    public function destroy(Category $category)
    {
        $this->authorize('delete', $category);

        $category->delete();

        return response()->noContent();
    }
}
