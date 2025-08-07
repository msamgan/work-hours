@if (session('status'))
    <div id="flash-message" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
         role="alert">
        <span class="block sm:inline">{{ session('status') }}</span>
    </div>
@endif

@if (session('error'))
    <div id="error-message" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
         role="alert">
        <span class="block sm:inline">{{ session('error') }}</span>
    </div>
@endif

@if (session('success'))
    <div id="success-message" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
         role="alert">
        <span class="block sm:inline">{{ session('success') }}</span>
    </div>
@endif

@if (session('warning'))
    <div id="warning-message" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
         role="alert">
        <span class="block sm:inline">{{ session('warning') }}</span>
    </div>
@endif

<script>
    // Auto-dismiss flash messages after 3 seconds
    document.addEventListener('DOMContentLoaded', function() {
        const flashMessages = document.querySelectorAll('[role="alert"]')
        flashMessages.forEach(function(message) {
            setTimeout(function() {
                if (message && message.parentNode) {
                    message.remove()
                }
            }, 3000)
        })
    })
</script>
