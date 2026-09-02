<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SummaryController extends Controller
{
    public function byCategory(Request $request)
    {
        return $request->user()
            ->expenses()
            ->selectRaw('category_id, SUM(amount) as total')
            ->groupBy('category_id')
            ->with('category:id,name')
            ->get();
    }

    public function byMonth(Request $request)
    {
        return $request->user()
            ->expenses()
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as month, SUM(amount) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }
}
