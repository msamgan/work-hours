<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\UpdateInvoiceRequest;
use App\Http\Stores\ClientStore;
use App\Http\Stores\InvoiceStore;
use App\Http\Stores\TimeLogStore;
use App\Models\Client;
use App\Models\Invoice;
use App\Notifications\InvoiceStatusChanged;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;
use Msamgan\Lact\Attributes\Action;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

final class InvoiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $clients = ClientStore::userClients(Auth::id());

        return Inertia::render('invoice/index', [
            'filters' => [
                'search' => request('search', ''),
                'client' => request('client', ''),
                'status' => request('status', ''),
                'created-date-from' => request('created-date-from', ''),
                'created-date-to' => request('created-date-to', ''),
            ],
            'clients' => $clients,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $clients = ClientStore::userClients(Auth::id());
        $timeLogs = TimeLogStore::unpaidTimeLog(Auth::id());

        return Inertia::render('invoice/create', [
            'clients' => $clients,
            'timeLogs' => $timeLogs,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @throws Throwable
     */
    #[Action(method: 'post', name: 'invoice.store', middleware: ['auth', 'verified'])]
    public function store(StoreInvoiceRequest $request): void
    {
        DB::beginTransaction();
        try {
            InvoiceStore::createInvoice($request->validated(), Auth::id());
            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Invoice $invoice): Response
    {
        $clients = ClientStore::userClients(Auth::id());
        $timeLogs = TimeLogStore::unpaidTimeLogs(Auth::id());

        return Inertia::render('invoice/edit', [
            'invoice' => $invoice->load('items.timeLog'),
            'clients' => $clients,
            'timeLogs' => $timeLogs,
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @throws Throwable
     */
    #[Action(method: 'put', name: 'invoice.update', params: ['invoice'], middleware: ['auth', 'verified'])]
    public function update(UpdateInvoiceRequest $request, Invoice $invoice): void
    {
        DB::beginTransaction();
        try {
            InvoiceStore::updateInvoice($invoice, $request->validated());
            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @throws Throwable
     */
    #[Action(method: 'delete', name: 'invoice.destroy', params: ['invoice'], middleware: ['auth', 'verified'])]
    public function destroy(Invoice $invoice): void
    {
        DB::beginTransaction();
        try {
            $invoice->delete();
            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Display the invoices for the specified client.
     */
    public function clientInvoices(Client $client): Response
    {
        $invoices = InvoiceStore::clientInvoices($client);

        return Inertia::render('invoice/client-invoices', [
            'client' => $client,
            'invoices' => $invoices,
        ]);
    }

    /**
     * Get invoices for the authenticated user
     */
    #[Action(method: 'get', name: 'invoice.list', middleware: ['auth', 'verified'])]
    public function invoices(): Collection
    {
        return InvoiceStore::userInvoices(Auth::id());
    }

    /**
     * Export invoices to CSV
     */
    #[Action(method: 'get', name: 'invoice.export', middleware: ['auth', 'verified'])]
    public function invoiceExport(): StreamedResponse
    {
        $headers = ['ID', 'Invoice Number', 'Client', 'Issue Date', 'Due Date', 'Total Amount', 'Paid Amount', 'Status', 'Created At'];
        $filename = 'invoices_' . Carbon::now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($headers): void {
            $output = fopen('php://output', 'w');
            fputcsv($output, $headers);

            InvoiceStore::invoiceExportMapper(InvoiceStore::userInvoices(Auth::id()))
                ->each(function ($row) use ($output): void {
                    fputcsv($output, $row);
                });

            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Get unpaid time logs grouped by project for a specific client
     */
    #[Action(method: 'get', name: 'getUnpaidTimeLogs', middleware: ['auth', 'verified'])]
    public function getUnpaidTimeLogs(): array
    {
        $clientId = request('client_id');

        if (! $clientId) {
            return [];
        }

        return TimeLogStore::unpaidTimeLogsGroupedByProject((int) $clientId);
    }

    /**
     * Download invoice as PDF
     */
    #[Action(method: 'get', name: 'invoice.downloadPdf', params: ['invoice'], middleware: ['auth', 'verified'])]
    public function downloadPdf(Invoice $invoice): SymfonyResponse
    {
        // Load necessary relationships if not already loaded
        if (! $invoice->relationLoaded('client')) {
            $invoice->load('client');
        }

        if (! $invoice->relationLoaded('items')) {
            $invoice->load('items');
        }

        if (! $invoice->relationLoaded('user')) {
            $invoice->load('user');
        }

        try {
            // Generate PDF using the invoice data
            $pdf = Pdf::loadView('pdf.invoice', [
                'invoice' => $invoice,
                'client' => $invoice->client,
                'items' => $invoice->items,
            ]);

            // Return the PDF as a downloadable response
            return $pdf->download("Invoice_{$invoice->invoice_number}.pdf");
        } catch (Exception $e) {
            // Log the error and return a response
            Log::error('Failed to generate invoice PDF: ' . $e->getMessage());

            return response()->json(['error' => 'Failed to generate PDF'], 500);
        }
    }

    /**
     * Send invoice email to client and update status to sent
     *
     * @throws Throwable
     */
    #[Action(method: 'post', name: 'invoice.sendEmail', params: ['invoice'], middleware: ['auth', 'verified'])]
    public function sendEmail(Invoice $invoice): void
    {
        DB::beginTransaction();
        try {
            // Send invoice email and update status
            InvoiceStore::sendInvoiceEmail($invoice);

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update invoice status and paid amount
     *
     * @throws Throwable
     */
    #[Action(method: 'post', name: 'invoice.updateStatus', params: ['invoice'], middleware: ['auth', 'verified'])]
    public function updateStatus(Invoice $invoice): void
    {
        // Validate request data
        request()->validate([
            'status' => 'required|string|in:draft,sent,paid,partially_paid,overdue,cancelled',
            'paid_amount' => 'required_if:status,paid,partially_paid|numeric|min:0',
        ]);

        $newStatus = request('status');

        DB::beginTransaction();
        try {
            // Update invoice status and paid amount
            $invoice->status = $newStatus;

            // Update paid amount if provided
            if (request()->has('paid_amount')) {
                $invoice->paid_amount = request('paid_amount');
            }

            $invoice->save();

            // Notify client if status is sent or overdue
            if ($newStatus === 'sent') {
                // For sent status, use the existing method which also updates the status
                InvoiceStore::sendInvoiceEmail($invoice);
            } elseif ($newStatus === 'overdue') {
                if (! $invoice->relationLoaded('client')) {
                    $invoice->load('client');
                }

                $clientEmail = $invoice->client->email;

                if ($clientEmail) {
                    Notification::route('mail', $clientEmail)->notify(new InvoiceStatusChanged($invoice));
                }
            }

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
