@component('mail::message')
{{-- Header --}}
@isset($header)
@component('mail::header', ['url' => $homeUrl])
{{ $header }}
@endcomponent
@endisset

{{-- Body --}}
{{ $message->render() }}

{{-- Subcopy --}}
@isset($subcopy)
@component('mail::subcopy')
{{ $subcopy }}
@endcomponent
@endisset

{{-- Footer --}}
@component('mail::footer')
© {{ date('Y') }} {{ $mailer['name'] ?? 'Voyages Organisés' }}. @lang('All rights reserved.')
@endcomponent
@endcomponent
