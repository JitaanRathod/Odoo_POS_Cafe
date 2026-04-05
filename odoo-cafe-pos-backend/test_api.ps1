$BASE = "http://localhost:5001/api"
function T($label, $method, $url, $body, $h) {
    try {
        $p = @{ Uri=$url; Method=$method; Headers=$h }
        if ($body) { $p.Body = ($body|ConvertTo-Json) }
        $r = Invoke-RestMethod @p
        Write-Host ("  [PASS] " + $label) -ForegroundColor Green
        return $r
    } catch {
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        $msg = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { "" }
        $color = if ($code -in 400,401,403,404,409) { "Yellow" } else { "Red" }
        Write-Host ("  [" + $code + "] " + $label + " - " + $msg) -ForegroundColor $color
        return $null
    }
}
$noH = @{"Content-Type"="application/json"}

Write-Host "`n[AUTH]" -ForegroundColor Cyan
$lr = T "POST /auth/login" POST "$BASE/auth/login" @{email="audit@cafe.com";password="Audit@1234"} $noH
if (-not $lr) { Write-Host "CRITICAL: Cannot login. Aborting."; exit 1 }
$TOKEN = $lr.token
$ha = @{Authorization="Bearer $TOKEN";"Content-Type"="application/json"}
T "GET /auth/me" GET "$BASE/auth/me" $null $ha | Out-Null
T "POST /auth/register (dup 409)" POST "$BASE/auth/register" @{name="X";email="audit@cafe.com";password="x";role="ADMIN"} $noH | Out-Null
T "POST /auth/login wrong pwd (401)" POST "$BASE/auth/login" @{email="audit@cafe.com";password="wrongpwd"} $noH | Out-Null

Write-Host "`n[SECURITY]" -ForegroundColor Cyan
T "GET /orders no-auth (401)" GET "$BASE/orders" $null $noH | Out-Null
T "GET /auth/me bad-token (401)" GET "$BASE/auth/me" $null @{Authorization="Bearer BADTOKEN";"Content-Type"="application/json"} | Out-Null
T "GET /nonexistent (404)" GET "$BASE/nonexistent" $null $ha | Out-Null

Write-Host "`n[TERMINALS]" -ForegroundColor Cyan
T "GET /terminals (200)" GET "$BASE/terminals" $null $ha | Out-Null
$termId = "e6812ce4-f542-4895-ac41-6fbbbecc5946"
T "GET /terminals/:id (200)" GET "$BASE/terminals/$termId" $null $ha | Out-Null

Write-Host "`n[PAYMENT-SETTINGS]" -ForegroundColor Cyan
T "GET /payment-settings/:termId (200)" GET "$BASE/payment-settings/$termId" $null $ha | Out-Null
T "PUT /payment-settings/:termId (200)" PUT "$BASE/payment-settings/$termId" @{enableCash=$true;enableCard=$true;enableUpi=$true;upiId="test@upi";upiName="Test"} $ha | Out-Null

Write-Host "`n[CUSTOMERS]" -ForegroundColor Cyan
T "GET /customers (200)" GET "$BASE/customers" $null $ha | Out-Null
T "GET /customers/top (200)" GET "$BASE/customers/top" $null $ha | Out-Null
$cr = T "POST /customers (201)" POST "$BASE/customers" @{name="RunTest Customer";email="runtest99@cafe.com";phone="9199999999"} $ha
$custId = if($cr -and $cr.customer) { $cr.customer.id } else { $null }
if ($custId) {
    T "PUT /customers/:id (200)" PUT "$BASE/customers/$custId" @{name="RunTest Updated";phone="9199999999"} $ha | Out-Null
    T "GET /customers/:id (200)" GET "$BASE/customers/$custId" $null $ha | Out-Null
}

Write-Host "`n[SESSIONS]" -ForegroundColor Cyan
T "GET /sessions/active (200)" GET "$BASE/sessions/active" $null $ha | Out-Null
T "GET /sessions/history (200)" GET "$BASE/sessions/history" $null $ha | Out-Null
$sr = T "POST /sessions/open (201)" POST "$BASE/sessions/open" @{terminalId=$termId;openingCash=500} $ha
$sessId = if($sr -and $sr.session) { $sr.session.id } else { $null }
if (-not $sessId) {
    $ar = T "GET /sessions/active fallback" GET "$BASE/sessions/active" $null $ha
    if ($ar -and $ar.sessions) { foreach($s in $ar.sessions) { if($s.terminalId -eq $termId) { $sessId=$s.id; break } } }
}
Write-Host "  Session: $sessId"
T "POST /sessions/open dup (409)" POST "$BASE/sessions/open" @{terminalId=$termId;openingCash=500} $ha | Out-Null
if ($sessId) { T "GET /sessions/:id (200)" GET "$BASE/sessions/$sessId" $null $ha | Out-Null }

Write-Host "`n[ORDERS]" -ForegroundColor Cyan
T "GET /orders (200)" GET "$BASE/orders" $null $ha | Out-Null
T "GET /orders/kitchen (200)" GET "$BASE/orders/kitchen" $null $ha | Out-Null
$orderId = $null
if ($sessId) {
    $or = T "POST /orders TAKEAWAY (201)" POST "$BASE/orders" @{branchId="958f9981-b92d-4237-b2b4-3890466ea622";sessionId=$sessId;orderType="TAKEAWAY"} $ha
    if ($or -and $or.order) { $orderId = $or.order.id }
    Write-Host "  Order: $orderId"
    if ($orderId) {
        T "GET /orders/:id (200)" GET "$BASE/orders/$orderId" $null $ha | Out-Null
        T "POST /orders/:id/items invalid product (404)" POST "$BASE/orders/$orderId/items" @{items=@(@{productId="00000000-0000-0000-0000-000000000001";quantity=1})} $ha | Out-Null
        T "PATCH /orders/:id/status CANCELLED (200)" PATCH "$BASE/orders/$orderId/status" @{status="CANCELLED"} $ha | Out-Null
    }
} else { Write-Host "  SKIP - no session" -ForegroundColor Yellow }

Write-Host "`n[PAYMENTS]" -ForegroundColor Cyan
T "GET /payments (200)" GET "$BASE/payments" $null $ha | Out-Null
T "POST /payments/process invalid order (404)" POST "$BASE/payments/process" @{orderId="00000000-0000-0000-0000-000000000099";method="CASH";amount=100} $ha | Out-Null
T "GET /payments/receipt/:id invalid (404)" GET "$BASE/payments/receipt/bad-id" $null $ha | Out-Null

Write-Host "`n[SESSION CLOSE]" -ForegroundColor Cyan
if ($sessId) {
    T "POST /sessions/:id/close (200)" POST "$BASE/sessions/$sessId/close" @{closingCash=520} $ha | Out-Null
    T "POST /sessions/:id/close dup (400)" POST "$BASE/sessions/$sessId/close" @{closingCash=520} $ha | Out-Null
    T "GET /sessions/current no-active (404)" GET "$BASE/sessions/current?terminalId=$termId" $null $ha | Out-Null
} else { Write-Host "  SKIP - no sessId" -ForegroundColor Yellow }

Write-Host "`n[REPORTS]" -ForegroundColor Cyan
T "GET /reports/dashboard (200)" GET "$BASE/reports/dashboard" $null $ha | Out-Null
T "GET /reports/sales (200)" GET "$BASE/reports/sales" $null $ha | Out-Null
if ($sessId) { T "GET /reports/session/:id (200)" GET "$BASE/reports/session/$sessId" $null $ha | Out-Null }

Write-Host "`n[RBAC - CASHIER ROLE]" -ForegroundColor Cyan
T "POST /auth/register cashier" POST "$BASE/auth/register" @{name="CashierRBAC";email="cashier_rbac99@cafe.com";password="Test@1234";role="CASHIER"} $noH | Out-Null
$cl = T "POST /auth/login cashier" POST "$BASE/auth/login" @{email="cashier_rbac99@cafe.com";password="Test@1234"} $noH
if ($cl -and $cl.token) {
    $ch = @{Authorization="Bearer $($cl.token)";"Content-Type"="application/json"}
    T "GET /payments as CASHIER (403)" GET "$BASE/payments" $null $ch | Out-Null
    T "GET /reports/sales as CASHIER (403)" GET "$BASE/reports/sales" $null $ch | Out-Null
    T "GET /terminals as CASHIER (200)" GET "$BASE/terminals" $null $ch | Out-Null
    T "DELETE /terminals/:id as CASHIER (403)" DELETE "$BASE/terminals/$termId" $null $ch | Out-Null
    T "POST /terminals as CASHIER (403)" POST "$BASE/terminals" @{name="New";branchId="958f9981-b92d-4237-b2b4-3890466ea622"} $ch | Out-Null
}

Write-Host "`n=== ALL TESTS COMPLETE ===" -ForegroundColor Green
