# Wie mehrfache Zuweisungen eines Dienstes behandelt werden

## Kurze Antwort
**Mehrfache Zuweisungen desselben Dienstes in einem Event werden aktuell NICHT vollständig unterstützt.** Das System funktioniert unter der Annahme einer **1:1-Beziehung** zwischen Service und Zuweisung.

---

## Detaillierte Funktionsweise

### 1. **Daten aus ChurchTools** (pollService.ts, Zeilen 226-261)
Wenn ein Service in einem Event mehrmals ausgewählt wurde, liefert die ChurchTools API **pro Service-Instanz ein separates `eventService`-Objekt**:

```typescript
// Aus der ChurchTools API kommen multiple eventService-Objekte:
// eventService[0].id = "service-1", eventService[0].person = Person1
// eventService[1].id = "service-2", eventService[1].person = Person2  (GLEICHER Service, aber andere ID)
```

**Jede Service-Instanz wird als eigenständiger Service behandelt**, nicht als Duplikat:
- Jede bekommt eine **eigene `id`** (die `eventService.id`, nicht `serviceId`)
- Jede kann **eigene Zuweisungen** haben
- Jede hat eine **separate Antwortzeile** in der Admin-Tabelle

### 2. **Zuweisungsextraktion**
Pro Service-Instanz wird **maximal eine Zuweisung** extrahiert:

```typescript
// Zeilen 233-246 in pollService.ts
const assignments: ServiceAssignment[] = [];
if (eventService.person) {
    assignments.push({
        personId: person.domainId,
        personName: `${firstName} ${lastName}`,
        isConfirmed: eventService.isAccepted === true,
    });
}
```

**Falls ein Service mehrere Personen hatte** (in ChurchTools möglich), würde nur die erste extrahiert.

### 3. **Anzeige in der Umfrage-Ansicht**
**EventCard.vue (Zeilen 75-79):**
```typescript
if (!props.showAssigned) {
    services = services.filter(
        (service) => !service.assignments || service.assignments.length === 0
    );
}
```

Ein Service wird als "zugewiesen" betrachtet, wenn `assignments.length > 0`.

**→ Bei mehrfacher Auswahl:** Der erste wird mit der Zuweisung angezeigt, die anderen ohne.

### 4. **Anzeige in der Admin-Tabelle**
**pollService.ts, Zeilen 770-777:**
```typescript
let assignmentText = '';
if (service.assignments && service.assignments.length > 0) {
    const assignment = service.assignments[0];  // NUR ERSTE!
    assignmentText = assignment.isConfirmed 
        ? assignment.personName 
        : `${assignment.personName} (angefordert)`;
}
```

**→ Nur die erste Zuweisung wird angezeigt**, auch wenn mehrere vorhanden sind.

### 5. **Poll-Responses speichern**
**pollService.ts, Zeilen 340-365:**
```typescript
// Lookup basiert auf (eventId, serviceId, userId)
const existing = responses.find(
    (r) => r.eventId === eventId && 
           r.serviceId === serviceId && 
           r.userId === userId
);
```

Wenn ein Service mehrmals im Event vorkommt, haben sie alle die **gleiche `serviceId`** → **Responses werden zusammengefasst**.

---

## Beispiel: Ein Service "Predigt" 2x in einem Event

| EventService | ID | ServiceId | Zugewiesene Person | In Admin-Tabelle |
|---|---|---|---|---|
| Instance 1 | 1001 | 5 | Person A | ✓ Zeigt "Person A" |
| Instance 2 | 1002 | 5 | Person B | ✓ Zeigt "Person B" |

Aber beim Speichern einer Antwort: **Beide nutzen `serviceId=5`**, daher können nicht beide separate Responses von demselben Nutzer haben.

---

## Limitation
- ❌ Ein Nutzer kann **nicht für beide Slots** des gleichen Services antworten
- ❌ **Mehrfache Zuweisung wird angezeigt**, aber als separate Zeilen, nicht als "2 Slots"
- ✓ Funktioniert korrekt, wenn jeder Service-Slot **unterschiedliche Personen** hat

---

## Wo könnte dies erweitert werden
1. **ServiceInfo-Type** um `quantity` oder `slotIndex` erweitern
2. **Response-Lookup** um slotIndex erweitern: `(eventId, serviceId, slotIndex, userId)`
3. **Admin-Tabelle** Gruppierung pro Service mit Slot-Anzeige
