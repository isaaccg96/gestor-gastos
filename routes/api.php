<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\SummaryController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('expenses', ExpenseController::class);
    Route::get('/summary/by-category', [SummaryController::class, 'byCategory']);
    Route::get('/summary/by-month', [SummaryController::class, 'byMonth']);
});
