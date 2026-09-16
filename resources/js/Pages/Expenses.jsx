import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
} from 'recharts';

const themes = {
    default: {
        bg: 'bg-gray-100',
        card: 'bg-white',
        text: 'text-gray-900',
        heading: 'text-gray-800',
        muted: 'text-gray-500',
        border: 'border-gray-200',
        track: 'bg-gray-200',
        button: 'bg-gray-800 hover:bg-gray-900',
        buttonText: 'text-white',
    },
    pink: {
        bg: 'bg-pink-50',
        card: 'bg-white',
        text: 'text-gray-900',
        heading: 'text-pink-900',
        muted: 'text-pink-400',
        border: 'border-pink-200',
        track: 'bg-pink-100',
        button: 'bg-pink-400 hover:bg-pink-500',
        buttonText: 'text-white',
    },
    blue: {
        bg: 'bg-blue-50',
        card: 'bg-white',
        text: 'text-gray-900',
        heading: 'text-blue-900',
        muted: 'text-blue-400',
        border: 'border-blue-200',
        track: 'bg-blue-100',
        button: 'bg-blue-700 hover:bg-blue-800',
        buttonText: 'text-white',
    },
    green: {
        bg: 'bg-emerald-950',
        card: 'bg-emerald-900',
        text: 'text-emerald-50',
        heading: 'text-emerald-50',
        muted: 'text-emerald-300',
        border: 'border-emerald-700',
        track: 'bg-emerald-800',
        button: 'bg-emerald-600 hover:bg-emerald-500',
        buttonText: 'text-white',
    },
};

export default function Expenses() {
    const [categories, setCategories] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [summaryByCategory, setSummaryByCategory] = useState([]);
    const [summaryByMonth, setSummaryByMonth] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [themeKey, setThemeKey] = useState('default');
    const theme = themes[themeKey] || themes.default;

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryBudget, setNewCategoryBudget] = useState('');
    const [submittingCategory, setSubmittingCategory] = useState(false);

    const [newExpense, setNewExpense] = useState({
        amount: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        category_id: '',
    });
    const [submittingExpense, setSubmittingExpense] = useState(false);

    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [editingCategoryBudget, setEditingCategoryBudget] = useState('');

    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [editingExpense, setEditingExpense] = useState({
        amount: '',
        description: '',
        date: '',
        category_id: '',
    });

    const [expensesPage, setExpensesPage] = useState(1);
    const [expensesLastPage, setExpensesLastPage] = useState(1);

    useEffect(() => {
        const stored = localStorage.getItem('gastos-theme');
        if (stored && themes[stored]) {
            setThemeKey(stored);
        }

        const handleThemeChange = () => {
            const updated = localStorage.getItem('gastos-theme');
            setThemeKey(updated && themes[updated] ? updated : 'default');
        };

        window.addEventListener('themechange', handleThemeChange);
        return () =>
            window.removeEventListener('themechange', handleThemeChange);
    }, []);

    const getCsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const fetchCategories = () => {
        return fetch('/api/categories', {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        }).then((res) => res.json());
    };

    const fetchExpenses = (page = 1) => {
        return fetch(`/api/expenses?page=${page}`, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        }).then((res) => res.json());
    };

    const fetchSummaryByCategory = () => {
        return fetch('/api/summary/by-category', {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        }).then((res) => res.json());
    };

    const fetchSummaryByMonth = () => {
        return fetch('/api/summary/by-month', {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        }).then((res) => res.json());
    };

    const loadAll = (page = expensesPage) => {
        setLoading(true);
        Promise.all([
            fetchCategories(),
            fetchExpenses(page),
            fetchSummaryByCategory(),
            fetchSummaryByMonth(),
        ])
            .then(
                ([
                    categoriesData,
                    expensesData,
                    summaryByCategoryData,
                    summaryByMonthData,
                ]) => {
                    setCategories(categoriesData);
                    setExpenses(expensesData.data);
                    setExpensesPage(expensesData.current_page);
                    setExpensesLastPage(expensesData.last_page);
                    setSummaryByCategory(summaryByCategoryData);
                    setSummaryByMonth(summaryByMonthData);
                    setLoading(false);
                },
            )
            .catch(() => {
                setError('Error al cargar los datos');
                setLoading(false);
            });
    };

    useEffect(() => {
        loadAll();
    }, []);

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        setSubmittingCategory(true);

        fetch('/api/categories', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
            },
            body: JSON.stringify({
                name: newCategoryName,
                budget_limit: newCategoryBudget || null,
            }),
        })
            .then((res) => {
                if (!res.ok) throw new Error('Error al crear la categoría');
                return res.json();
            })
            .then(() => {
                setNewCategoryName('');
                setNewCategoryBudget('');
                setSubmittingCategory(false);
                loadAll();
            })
            .catch((err) => {
                setError(err.message);
                setSubmittingCategory(false);
            });
    };

    const handleDeleteCategory = (categoryId) => {
        if (!confirm('¿Eliminar esta categoría?')) return;

        fetch(`/api/categories/${categoryId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Error al eliminar la categoría');
                loadAll();
            })
            .catch((err) => setError(err.message));
    };

    const startEditingCategory = (category) => {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
        setEditingCategoryBudget(category.budget_limit ?? '');
    };

    const cancelEditingCategory = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
        setEditingCategoryBudget('');
    };

    const handleUpdateCategory = (e) => {
        e.preventDefault();

        fetch(`/api/categories/${editingCategoryId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
            },
            body: JSON.stringify({
                name: editingCategoryName,
                budget_limit: editingCategoryBudget || null,
            }),
        })
            .then((res) => {
                if (!res.ok)
                    throw new Error('Error al actualizar la categoría');
                cancelEditingCategory();
                loadAll();
            })
            .catch((err) => setError(err.message));
    };

    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        setSubmittingExpense(true);

        fetch('/api/expenses', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
            },
            body: JSON.stringify(newExpense),
        })
            .then((res) => {
                if (!res.ok) throw new Error('Error al crear el gasto');
                return res.json();
            })
            .then(() => {
                setNewExpense({
                    amount: '',
                    description: '',
                    date: new Date().toISOString().slice(0, 10),
                    category_id: '',
                });
                setSubmittingExpense(false);
                loadAll();
            })
            .catch((err) => {
                setError(err.message);
                setSubmittingExpense(false);
            });
    };

    const handleDeleteExpense = (expenseId) => {
        if (!confirm('¿Eliminar este gasto?')) return;

        fetch(`/api/expenses/${expenseId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Error al eliminar el gasto');
                loadAll();
            })
            .catch((err) => setError(err.message));
    };

    const startEditingExpense = (expense) => {
        setEditingExpenseId(expense.id);
        setEditingExpense({
            amount: expense.amount,
            description: expense.description || '',
            date: expense.date,
            category_id: expense.category_id,
        });
    };

    const cancelEditingExpense = () => {
        setEditingExpenseId(null);
    };

    const handleUpdateExpense = (e) => {
        e.preventDefault();

        fetch(`/api/expenses/${editingExpenseId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
            },
            body: JSON.stringify(editingExpense),
        })
            .then((res) => {
                if (!res.ok) throw new Error('Error al actualizar el gasto');
                cancelEditingExpense();
                loadAll();
            })
            .catch((err) => setError(err.message));
    };

    const goToPage = (page) => {
        if (page < 1 || page > expensesLastPage) return;
        loadAll(page);
    };

    const categoryChartData = summaryByCategory.map((item) => ({
        name: item.category?.name || 'Sin categoría',
        total: parseFloat(item.total),
    }));

    const monthChartData = summaryByMonth.map((item) => ({
        month: item.month,
        total: parseFloat(item.total),
    }));

    const getBudgetProgress = (category) => {
        const spent = parseFloat(category.expenses_sum_amount) || 0;
        const limit = parseFloat(category.budget_limit);

        if (!limit || limit <= 0) {
            return null;
        }

        const percentage = Math.min((spent / limit) * 100, 100);

        let color = 'bg-green-500';
        if (percentage >= 100) {
            color = 'bg-red-500';
        } else if (percentage >= 80) {
            color = 'bg-yellow-500';
        }

        return { spent, limit, percentage, color };
    };

    const getOverallBudgetProgress = () => {
        const categoriesWithBudget = categories.filter(
            (c) => parseFloat(c.budget_limit) > 0,
        );

        if (categoriesWithBudget.length === 0) {
            return null;
        }

        const totalLimit = categoriesWithBudget.reduce(
            (sum, c) => sum + parseFloat(c.budget_limit),
            0,
        );

        const totalSpent = categoriesWithBudget.reduce(
            (sum, c) => sum + (parseFloat(c.expenses_sum_amount) || 0),
            0,
        );

        const percentage = Math.min((totalSpent / totalLimit) * 100, 100);

        let color = 'bg-green-500';
        if (percentage >= 100) {
            color = 'bg-red-500';
        } else if (percentage >= 80) {
            color = 'bg-yellow-500';
        }

        return { spent: totalSpent, limit: totalLimit, percentage, color };
    };

    const overallProgress = getOverallBudgetProgress();

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Gastos
                </h2>
            }
        >
            <Head title="Gastos" />
            <div className={`py-12 min-h-screen ${theme.bg}`}>
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {error && (
                        <div className="rounded bg-red-50 p-4 text-red-600">
                            {error}
                        </div>
                    )}

                    {/* GRÁFICOS */}
                    {!loading && categoryChartData.length > 0 && (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div
                                className={`overflow-hidden ${theme.card} p-6 shadow-sm sm:rounded-lg`}
                            >
                                <h3
                                    className={`mb-4 text-lg font-medium ${theme.heading}`}
                                >
                                    Gasto por categoría
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={categoryChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="total" fill="#1f2937" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div
                                className={`overflow-hidden ${theme.card} p-6 shadow-sm sm:rounded-lg`}
                            >
                                <h3
                                    className={`mb-4 text-lg font-medium ${theme.heading}`}
                                >
                                    Gasto por mes
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={monthChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#1f2937"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* PRESUPUESTO TOTAL */}
                    {!loading && overallProgress && (
                        <div
                            className={`overflow-hidden ${theme.card} p-6 shadow-sm sm:rounded-lg`}
                        >
                            <h3
                                className={`mb-2 text-lg font-medium ${theme.heading}`}
                            >
                                Presupuesto total
                            </h3>
                            <div
                                className={`h-3 w-full overflow-hidden rounded-full ${theme.track}`}
                            >
                                <div
                                    className={`h-full ${overallProgress.color} transition-all`}
                                    style={{
                                        width: `${overallProgress.percentage}%`,
                                    }}
                                />
                            </div>
                            <p className={`mt-1 text-sm ${theme.muted}`}>
                                {overallProgress.spent.toFixed(2)}€ de{' '}
                                {overallProgress.limit.toFixed(2)}€
                            </p>
                        </div>
                    )}

                    {/* CATEGORÍAS */}
                    <div
                        className={`overflow-hidden ${theme.card} shadow-sm sm:rounded-lg`}
                    >
                        <div className={`p-6 ${theme.text}`}>
                            <h3
                                className={`mb-4 text-lg font-medium ${theme.heading}`}
                            >
                                Categorías
                            </h3>

                            <form
                                onSubmit={handleCategorySubmit}
                                className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center"
                            >
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) =>
                                        setNewCategoryName(e.target.value)
                                    }
                                    placeholder="Nombre de la categoría"
                                    className="flex-1 rounded border-gray-300 shadow-sm"
                                    required
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newCategoryBudget}
                                    onChange={(e) =>
                                        setNewCategoryBudget(e.target.value)
                                    }
                                    placeholder="Límite (opcional)"
                                    className="w-40 rounded border-gray-300 shadow-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={submittingCategory}
                                    className={`rounded px-4 py-2 ${theme.button} ${theme.buttonText} disabled:opacity-50`}
                                >
                                    {submittingCategory
                                        ? 'Guardando...'
                                        : 'Añadir'}
                                </button>
                            </form>

                            {!loading && (
                                <ul className="space-y-2">
                                    {categories.map((category) => (
                                        <li
                                            key={category.id}
                                            className={`flex items-center justify-between rounded border ${theme.border} p-3`}
                                        >
                                            {editingCategoryId ===
                                            category.id ? (
                                                <form
                                                    onSubmit={
                                                        handleUpdateCategory
                                                    }
                                                    className="flex flex-1 flex-col items-start gap-2 sm:flex-row sm:items-center"
                                                >
                                                    <input
                                                        type="text"
                                                        value={
                                                            editingCategoryName
                                                        }
                                                        onChange={(e) =>
                                                            setEditingCategoryName(
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="flex-1 rounded border-gray-300 shadow-sm"
                                                        required
                                                        autoFocus
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={
                                                            editingCategoryBudget
                                                        }
                                                        onChange={(e) =>
                                                            setEditingCategoryBudget(
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Límite"
                                                        className="w-32 rounded border-gray-300 shadow-sm"
                                                    />
                                                    <div className="flex gap-3">
                                                        <button
                                                            type="submit"
                                                            className="text-sm text-green-600 hover:underline"
                                                        >
                                                            Guardar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                cancelEditingCategory
                                                            }
                                                            className="text-sm text-gray-500 hover:underline"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <>
                                                    <div className="flex-1 pr-4">
                                                        <div className="flex items-center justify-between">
                                                            <span>
                                                                {category.name}
                                                            </span>
                                                        </div>
                                                        {getBudgetProgress(
                                                            category,
                                                        ) && (
                                                            <div className="mt-2">
                                                                <div
                                                                    className={`h-2 w-full overflow-hidden rounded-full ${theme.track}`}
                                                                >
                                                                    <div
                                                                        className={`h-full ${getBudgetProgress(category).color} transition-all`}
                                                                        style={{
                                                                            width: `${getBudgetProgress(category).percentage}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <p
                                                                    className={`mt-1 text-xs ${theme.muted}`}
                                                                >
                                                                    {getBudgetProgress(
                                                                        category,
                                                                    ).spent.toFixed(
                                                                        2,
                                                                    )}
                                                                    € de{' '}
                                                                    {getBudgetProgress(
                                                                        category,
                                                                    ).limit.toFixed(
                                                                        2,
                                                                    )}
                                                                    €
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() =>
                                                                startEditingCategory(
                                                                    category,
                                                                )
                                                            }
                                                            className="text-sm text-blue-600 hover:underline"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteCategory(
                                                                    category.id,
                                                                )
                                                            }
                                                            className="text-sm text-red-600 hover:underline"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* GASTOS */}
                    <div
                        className={`overflow-hidden ${theme.card} shadow-sm sm:rounded-lg`}
                    >
                        <div className={`p-6 ${theme.text}`}>
                            <h3
                                className={`mb-4 text-lg font-medium ${theme.heading}`}
                            >
                                Nuevo gasto
                            </h3>

                            <form
                                onSubmit={handleExpenseSubmit}
                                className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-5"
                            >
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Monto"
                                    value={newExpense.amount}
                                    onChange={(e) =>
                                        setNewExpense({
                                            ...newExpense,
                                            amount: e.target.value,
                                        })
                                    }
                                    className="rounded border-gray-300 shadow-sm"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Descripción"
                                    value={newExpense.description}
                                    onChange={(e) =>
                                        setNewExpense({
                                            ...newExpense,
                                            description: e.target.value,
                                        })
                                    }
                                    className="rounded border-gray-300 shadow-sm"
                                />
                                <input
                                    type="date"
                                    value={newExpense.date}
                                    onChange={(e) =>
                                        setNewExpense({
                                            ...newExpense,
                                            date: e.target.value,
                                        })
                                    }
                                    className="rounded border-gray-300 shadow-sm"
                                    required
                                />
                                <select
                                    value={newExpense.category_id}
                                    onChange={(e) =>
                                        setNewExpense({
                                            ...newExpense,
                                            category_id: e.target.value,
                                        })
                                    }
                                    className="rounded border-gray-300 shadow-sm"
                                    required
                                >
                                    <option value="">Categoría</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    disabled={submittingExpense}
                                    className={`rounded px-4 py-2 ${theme.button} ${theme.buttonText} disabled:opacity-50`}
                                >
                                    {submittingExpense
                                        ? 'Guardando...'
                                        : 'Añadir'}
                                </button>
                            </form>

                            <h3
                                className={`mb-4 text-lg font-medium ${theme.heading}`}
                            >
                                Mis gastos
                            </h3>

                            {loading && <p>Cargando...</p>}

                            {!loading && (
                                <ul className="space-y-2">
                                    {expenses.map((expense) => (
                                        <li
                                            key={expense.id}
                                            className={`rounded border ${theme.border} p-3`}
                                        >
                                            {editingExpenseId ===
                                            expense.id ? (
                                                <form
                                                    onSubmit={
                                                        handleUpdateExpense
                                                    }
                                                    className="grid grid-cols-1 gap-2 sm:grid-cols-5"
                                                >
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={
                                                            editingExpense.amount
                                                        }
                                                        onChange={(e) =>
                                                            setEditingExpense({
                                                                ...editingExpense,
                                                                amount: e
                                                                    .target
                                                                    .value,
                                                            })
                                                        }
                                                        className="rounded border-gray-300 shadow-sm"
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        value={
                                                            editingExpense.description
                                                        }
                                                        onChange={(e) =>
                                                            setEditingExpense({
                                                                ...editingExpense,
                                                                description:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="rounded border-gray-300 shadow-sm"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={
                                                            editingExpense.date
                                                        }
                                                        onChange={(e) =>
                                                            setEditingExpense({
                                                                ...editingExpense,
                                                                date: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        className="rounded border-gray-300 shadow-sm"
                                                        required
                                                    />
                                                    <select
                                                        value={
                                                            editingExpense.category_id
                                                        }
                                                        onChange={(e) =>
                                                            setEditingExpense({
                                                                ...editingExpense,
                                                                category_id:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="rounded border-gray-300 shadow-sm"
                                                        required
                                                    >
                                                        {categories.map(
                                                            (category) => (
                                                                <option
                                                                    key={
                                                                        category.id
                                                                    }
                                                                    value={
                                                                        category.id
                                                                    }
                                                                >
                                                                    {
                                                                        category.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <div className="flex gap-3">
                                                        <button
                                                            type="submit"
                                                            className="text-sm text-green-600 hover:underline"
                                                        >
                                                            Guardar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                cancelEditingExpense
                                                            }
                                                            className="text-sm text-gray-500 hover:underline"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium">
                                                            {expense.amount}€
                                                        </span>{' '}
                                                        —{' '}
                                                        {expense.description ||
                                                            'Sin descripción'}{' '}
                                                        <span
                                                            className={`text-sm ${theme.muted}`}
                                                        >
                                                            (
                                                            {
                                                                expense
                                                                    .category
                                                                    ?.name
                                                            }
                                                            , {expense.date})
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() =>
                                                                startEditingExpense(
                                                                    expense,
                                                                )
                                                            }
                                                            className="text-sm text-blue-600 hover:underline"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteExpense(
                                                                    expense.id,
                                                                )
                                                            }
                                                            className="text-sm text-red-600 hover:underline"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {!loading && expensesLastPage > 1 && (
                                <div className="mt-4 flex items-center justify-center gap-4">
                                    <button
                                        onClick={() =>
                                            goToPage(expensesPage - 1)
                                        }
                                        disabled={expensesPage === 1}
                                        className={`text-sm ${theme.muted} hover:underline disabled:opacity-30`}
                                    >
                                        Anterior
                                    </button>
                                    <span
                                        className={`text-sm ${theme.muted}`}
                                    >
                                        Página {expensesPage} de{' '}
                                        {expensesLastPage}
                                    </span>
                                    <button
                                        onClick={() =>
                                            goToPage(expensesPage + 1)
                                        }
                                        disabled={
                                            expensesPage === expensesLastPage
                                        }
                                        className={`text-sm ${theme.muted} hover:underline disabled:opacity-30`}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
