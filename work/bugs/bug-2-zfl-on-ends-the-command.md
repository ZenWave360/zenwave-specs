# BUG/2: an `on` that answers does not end the command

Reported and specified by the owner on 2026-11-03. Priority: first, together with [BUG/1](bug-1-zfl-flowchart-starts-skip-policy.md), when implementation resumes. Backlog: [BUG/2](../backlog.md).

Today `on X response Y` inside a `when … do` block is treated as one more step, so the generated diagrams continue past it. The owner's rule makes an `on` that answers an exit of the command. The example source is in BUG/1 (`book-slot-flow.zfl`), where `on SlotNotBookable response SlotNotBookable` follows `call getBookingTerms`.

## Work, in summary

1. **Spec.** Write the rule into the ZFL language spec in `zenwave-specs` (the owner's text below, as rules), before the code.
2. **Grammar (`dsl-kotlin`, optional part).** `flow_do_on: annotations ON flow_event_list (CALL flow_command_name | flow_signal_body);` so one `on` takes several events; `@outcome` on an early exit works through the existing `annotations`.
3. **Model.** Steps of `on` that answer (`response`, `emits`, `emits response`) are exits: `terminal: true`. `on X call Z` chains, and the `on` lines after it refer to Z's responses. What no `on` catches is the happy path.
4. **Validation.** Error when the event of an `on` is not a declared response of the preceding `call`. Warning for unreachable lines after `on` lines that catch every response of a call.
5. **Diagrams (`dsl-views`) and the EventFlow view model.** Draw an exit of the block, not one more step. Check the Mermaid flowchart (BUG/1), the sequence diagrams and the EventFlow graph.

## The owner's proposal, verbatim

````text
La regla
Un on atiende una respuesta de la llamada anterior y cierra el comando. La respuesta que no atiendes sigue al siguiente paso.

on X response Y, on X emits Y y on X emits response Y son salidas: hacen de return.
on X call Z encadena: las líneas on que vengan después se refieren a las respuestas de Z.
Lo que no captura ningún on (aquí BookingTermsResult) es el camino feliz y pasa a la siguiente línea.
Se lee como en lenguaje natural: "llamo a getBookingTerms; si no se puede reservar, respondo SlotNotBookable". Nadie entiende que después se siga ejecutando.

Tu ejemplo

when RequestBooking, RequestAssistedBooking do bookSlot {
    service Bookings.BookingService

    call getBookingTerms
    on SlotNotBookable response SlotNotBookable

    call checkBookingHolder
    @outcome("holder-rejected")
    on SlotNotBookable, HolderNotEligible response BookingRejected

    @outcome(confirmed)
    emits response BookingConfirmed
    @outcome("policy-violated")
    response BookingRejected
    @outcome("slot-full")
    response SlotFull
}
Cambios en la gramática
Solo uno, y es opcional: que on acepte una lista de eventos, para no repetir líneas que llevan a la misma salida:


flow_do_on: annotations ON flow_event_list (CALL flow_command_name | flow_signal_body);
annotations ya va delante de on, así que @outcome funciona sobre una salida anticipada sin tocar nada más.

Validaciones que hacen la regla visible
La regla se nota de verdad cuando el editor ayuda:

Error si el evento de un on no es una respuesta declarada de la call anterior. SlotNotBookable tiene que estar en el do getBookingTerms. Así queda claro a qué llamada pertenece cada on.
Aviso de código inalcanzable si un on captura todas las respuestas de una llamada y aun así hay líneas detrás.
En el modelo, marcar los pasos on de salida con terminal: true, para que los diagramas dibujen la salida del bloque y no un paso más.
````