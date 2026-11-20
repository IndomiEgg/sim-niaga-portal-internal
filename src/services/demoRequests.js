// Local request registry for the public letter workflow demo.
export const demoTicketKey = 'simniaga-demo-ticket';
const ticketListKey = 'simniaga-demo-tickets';

function readTickets() {
  try {
    const saved = JSON.parse(localStorage.getItem(ticketListKey) || 'null');
    if (Array.isArray(saved)) return saved;
    const legacy = JSON.parse(localStorage.getItem(demoTicketKey) || 'null');
    return legacy ? [legacy] : [];
  } catch {
    return [];
  }
}

export function getDemoTickets() {
  return readTickets();
}

export function getDemoTicket(ticketCode) {
  const tickets = readTickets();
  if (ticketCode) return tickets.find((ticket) => ticket.ticket === ticketCode) || null;
  return tickets.at(-1) || null;
}

export function saveDemoTicket(ticket) {
  const tickets = readTickets();
  const index = tickets.findIndex((item) => item.ticket === ticket.ticket);
  if (index >= 0) tickets[index] = ticket;
  else tickets.push(ticket);
  localStorage.setItem(ticketListKey, JSON.stringify(tickets));
  localStorage.setItem(demoTicketKey, JSON.stringify(ticket));
}

export function updateDemoTicket(patch, historyEntry, ticketCode) {
  const ticket = getDemoTicket(ticketCode);
  if (!ticket) return null;
  const updated = { ...ticket, ...patch, history: [...(ticket.history || []), historyEntry] };
  saveDemoTicket(updated);
  return updated;
}
