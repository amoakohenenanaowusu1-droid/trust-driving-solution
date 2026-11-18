// Trust Driving Solution - Scheduling App
// All data stored in localStorage for this demo

const STORAGE_KEYS = {
  bookings: 'tds_bookings',
  availability: 'tds_availability',
  instructors: 'tds_instructors'
};

// Default data
const DEFAULT_INSTRUCTORS = [
  { id: 'ins1', name: 'Sarah Mitchell', specialties: 'Manual & Automatic', experience: '12 years', bio: 'Patient instructor specialising in nervous drivers and test preparation.', color: 'bg-blue-500' },
  { id: 'ins2', name: 'James Okonkwo', specialties: 'Manual, Highway', experience: '9 years', bio: 'Former advanced driving instructor. Excellent for motorway confidence.', color: 'bg-emerald-500' },
  { id: 'ins3', name: 'Emily Chen', specialties: 'Automatic, Parking', experience: '7 years', bio: 'Great with beginners and parallel parking practice.', color: 'bg-violet-500' }
];

const LESSON_TYPES = [
  { id: 'regular', name: 'Regular Course', duration: 60, price: 45, description: 'Standard lesson for steady progress toward your test.', icon: 'fa-car' },
  { id: 'express', name: 'Express Course', duration: 90, price: 65, description: 'Faster-paced lessons for quicker progress.', icon: 'fa-bolt' },
  { id: 'expresso', name: 'Expresso Course', duration: 120, price: 85, description: 'Intensive sessions for accelerated learning.', icon: 'fa-rocket' },
  { id: 'refresher', name: 'Refresher Course', duration: 60, price: 48, description: 'For qualified drivers returning after a break.', icon: 'fa-sync-alt' },
  { id: 'highway', name: 'Highway / Motorway', duration: 60, price: 50, description: 'Dual carriageway and motorway confidence building.', icon: 'fa-road' },
  { id: 'testprep', name: 'Test Preparation', duration: 90, price: 75, description: 'Mock test conditions and examiner-style feedback.', icon: 'fa-clipboard-check' }
];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

// State
let currentWeekStart = getMonday(new Date());
let selectedLessonType = null;
let selectedSlot = null; // { instructorId, date, time }
let currentBookStep = 1;

// ---------- Storage helpers ----------
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getInstructors() {
  return load(STORAGE_KEYS.instructors, DEFAULT_INSTRUCTORS);
}

function getBookings() {
  return load(STORAGE_KEYS.bookings, []);
}

function getAvailability() {
  return load(STORAGE_KEYS.availability, []);
}

function saveBookings(list) {
  save(STORAGE_KEYS.bookings, list);
}

function saveAvailability(list) {
  save(STORAGE_KEYS.availability, list);
}

// ---------- Date helpers ----------
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatFullDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ---------- Initialisation ----------
function init() {
  // Seed availability if empty (demo data for the next 10 days)
  let avail = getAvailability();
  if (avail.length === 0) {
    const instructors = getInstructors();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= 12; i++) {
      const day = addDays(today, i);
      const dayOfWeek = day.getDay();
      if (dayOfWeek === 0) continue; // Sunday closed
      instructors.forEach((ins, idx) => {
        // Stagger hours a bit
        const starts = dayOfWeek === 6 ? ['09:00', '10:00', '11:00', '13:00', '14:00'] : ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
        starts.forEach(t => {
          // Not every instructor every day
          if ((idx + i) % 2 === 0 || Math.random() > 0.4) {
            avail.push({
              id: `av_${ins.id}_${formatDate(day)}_${t}`,
              instructorId: ins.id,
              date: formatDate(day),
              time: t
            });
          }
        });
      });
    }
    saveAvailability(avail);
  }

  // Populate UI
  renderLessonTypesHome();
  renderInstructorsHome();
  populateInstructorSelects();
  populateTimeSelects();
  setDefaultAdminDate();
  renderHeroSlots();
  showSection('home');

  // Mobile menu
  document.getElementById('mobile-menu-btn').addEventListener('click', toggleMobileMenu);
}

function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('hidden');
}

// ---------- Navigation ----------
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.getElementById(`section-${name}`).classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const active = document.querySelector(`.nav-link[data-section="${name}"]`);
  if (active) active.classList.add('active');

  if (name === 'book') {
    goToBookStep(1);
    renderBookLessonTypes();
  }
  if (name === 'admin') {
    renderAdminBookings();
    renderAdminAvailability();
  }
  if (name === 'schedule') {
    // keep existing content
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- Home rendering ----------
function renderLessonTypesHome() {
  const grid = document.getElementById('lesson-types-grid');
  grid.innerHTML = LESSON_TYPES.map(lt => `
    <div class="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-trust-200 transition">
      <div class="w-10 h-10 bg-trust-100 rounded-lg flex items-center justify-center mb-3">
        <i class="fas ${lt.icon} text-trust-600"></i>
      </div>
      <h4 class="font-semibold text-slate-900 mb-1">${lt.name}</h4>
      <p class="text-sm text-slate-600 mb-3">${lt.description}</p>
      <div class="flex items-center justify-between text-sm">
        <span class="text-slate-500">${lt.duration} min</span>
        <span class="font-semibold text-trust-700">£${lt.price}</span>
      </div>
    </div>
  `).join('');
}

function renderInstructorsHome() {
  const grid = document.getElementById('instructors-grid');
  const instructors = getInstructors();
  grid.innerHTML = instructors.map(ins => `
    <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-12 h-12 ${ins.color} rounded-full flex items-center justify-center text-white font-bold text-lg">
          ${ins.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h4 class="font-semibold text-slate-900">${ins.name}</h4>
          <p class="text-xs text-slate-500">${ins.experience} experience</p>
        </div>
      </div>
      <p class="text-sm text-slate-600 mb-2">${ins.bio}</p>
      <p class="text-xs font-medium text-trust-600">${ins.specialties}</p>
    </div>
  `).join('');
}

function renderHeroSlots() {
  const container = document.getElementById('hero-slots');
  const avail = getAvailability();
  const bookings = getBookings();
  const bookedKeys = new Set(bookings.filter(b => b.status !== 'cancelled').map(b => `${b.instructorId}|${b.date}|${b.time}`));
  const instructors = getInstructors();
  const open = avail
    .filter(a => !bookedKeys.has(`${a.instructorId}|${a.date}|${a.time}`))
    .filter(a => a.date >= formatDate(new Date()))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 4);

  if (open.length === 0) {
    container.innerHTML = '<p class="text-trust-100 text-sm">Check the booking page for latest availability.</p>';
    return;
  }

  container.innerHTML = open.map(s => {
    const ins = instructors.find(i => i.id === s.instructorId);
    return `
      <div class="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
        <span>${formatDisplayDate(s.date)} · ${s.time}</span>
        <span class="text-trust-100 text-xs">${ins ? ins.name.split(' ')[0] : ''}</span>
      </div>
    `;
  }).join('');
}

// ---------- Booking flow ----------
function renderBookLessonTypes() {
  const container = document.getElementById('book-lesson-types');
  container.innerHTML = LESSON_TYPES.map(lt => `
    <label class="relative flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:border-trust-300 transition ${selectedLessonType === lt.id ? 'border-trust-500 bg-trust-50 ring-1 ring-trust-500' : 'border-slate-200'}">
      <input type="radio" name="lessonType" value="${lt.id}" class="mt-1 text-trust-600" ${selectedLessonType === lt.id ? 'checked' : ''} onchange="selectedLessonType='${lt.id}'" />
      <div class="flex-1">
        <div class="font-medium text-slate-900 text-sm">${lt.name}</div>
        <div class="text-xs text-slate-500">${lt.duration} min · £${lt.price}</div>
      </div>
    </label>
  `).join('');
}

function populateInstructorSelects() {
  const instructors = getInstructors();
  const bookSelect = document.getElementById('book-instructor');
  const adminSelect = document.getElementById('admin-instructor');
  const options = instructors.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
  bookSelect.innerHTML = `<option value="any">Any available instructor</option>${options}`;
  adminSelect.innerHTML = options;
}

function populateTimeSelects() {
  const startSel = document.getElementById('admin-start');
  const endSel = document.getElementById('admin-end');
  startSel.innerHTML = TIME_SLOTS.map(t => `<option value="${t}">${t}</option>`).join('');
  endSel.innerHTML = TIME_SLOTS.map(t => `<option value="${t}">${t}</option>`).join('');
  endSel.value = '17:00';
}

function setDefaultAdminDate() {
  const input = document.getElementById('admin-date');
  const tomorrow = addDays(new Date(), 1);
  input.value = formatDate(tomorrow);
  input.min = formatDate(new Date());
}

function goToBookStep(step) {
  if (step === 2 && !selectedLessonType) {
    showToast('Please select a lesson type first.', 'error');
    return;
  }
  if (step === 3 && !selectedSlot) {
    showToast('Please select an available time slot.', 'error');
    return;
  }

  currentBookStep = step;
  document.getElementById('book-step-1').classList.toggle('hidden', step !== 1);
  document.getElementById('book-step-2').classList.toggle('hidden', step !== 2);
  document.getElementById('book-step-3').classList.toggle('hidden', step !== 3);

  // badges
  for (let i = 1; i <= 3; i++) {
    const badge = document.getElementById(`step-${i}-badge`);
    if (i < step) {
      badge.className = 'w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold text-xs';
      badge.innerHTML = '<i class="fas fa-check text-xs"></i>';
    } else if (i === step) {
      badge.className = 'w-7 h-7 rounded-full bg-trust-600 text-white flex items-center justify-center font-semibold text-xs';
      badge.textContent = i;
    } else {
      badge.className = 'w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-semibold text-xs';
      badge.textContent = i;
    }
  }

  if (step === 2) {
    renderAvailabilityCalendar();
  }
  if (step === 3) {
    updateBookingSummary();
  }
}

function changeWeek(dir) {
  currentWeekStart = addDays(currentWeekStart, dir * 7);
  // Don't go into the past
  const thisMonday = getMonday(new Date());
  if (currentWeekStart < thisMonday) currentWeekStart = thisMonday;
  renderAvailabilityCalendar();
}

function renderAvailabilityCalendar() {
  const container = document.getElementById('availability-calendar');
  const weekEnd = addDays(currentWeekStart, 6);
  document.getElementById('week-label').textContent =
    `${formatDisplayDate(formatDate(currentWeekStart))} – ${formatDisplayDate(formatDate(weekEnd))}`;

  const preferredInstructor = document.getElementById('book-instructor').value;
  const avail = getAvailability();
  const bookings = getBookings();
  const bookedKeys = new Set(
    bookings.filter(b => b.status !== 'cancelled').map(b => `${b.instructorId}|${b.date}|${b.time}`)
  );
  const instructors = getInstructors();

  // Build days Mon–Sat (skip Sunday for simplicity)
  let html = '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">';
  for (let i = 0; i < 6; i++) {
    const day = addDays(currentWeekStart, i);
    const iso = formatDate(day);
    const isPast = day < new Date().setHours(0, 0, 0, 0);

    let daySlots = avail.filter(a => a.date === iso && !bookedKeys.has(`${a.instructorId}|${a.date}|${a.time}`));
    if (preferredInstructor !== 'any') {
      daySlots = daySlots.filter(a => a.instructorId === preferredInstructor);
    }

    // Unique times
    const times = [...new Set(daySlots.map(s => s.time))].sort();

    html += `
      <div class="border border-slate-200 rounded-lg overflow-hidden ${isPast ? 'opacity-50' : ''}">
        <div class="bg-slate-100 px-2 py-1.5 text-center text-xs font-semibold text-slate-700">
          ${day.toLocaleDateString('en-GB', { weekday: 'short' })}<br>${day.getDate()} ${day.toLocaleDateString('en-GB', { month: 'short' })}
        </div>
        <div class="p-1.5 space-y-1 min-h-[80px]">
          ${isPast || times.length === 0
            ? '<p class="text-xs text-slate-400 text-center py-2">—</p>'
            : times.map(t => {
                const slotData = daySlots.find(s => s.time === t);
                const isSelected = selectedSlot && selectedSlot.date === iso && selectedSlot.time === t;
                return `
                  <button type="button"
                    onclick="selectSlot('${slotData.instructorId}', '${iso}', '${t}')"
                    class="slot-available w-full text-xs py-1.5 rounded font-medium transition
                      ${isSelected ? 'bg-trust-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'}">
                    ${t}
                  </button>
                `;
              }).join('')
          }
        </div>
      </div>
    `;
  }
  html += '</div>';
  container.innerHTML = html;
}

function selectSlot(instructorId, date, time) {
  selectedSlot = { instructorId, date, time };
  document.getElementById('btn-to-step3').disabled = false;
  renderAvailabilityCalendar(); // re-render to show selection
}

function updateBookingSummary() {
  const lt = LESSON_TYPES.find(l => l.id === selectedLessonType);
  const ins = getInstructors().find(i => i.id === selectedSlot.instructorId);
  document.getElementById('booking-summary').innerHTML = `
    <strong>${lt.name}</strong> (${lt.duration} min) · £${lt.price}<br>
    ${formatFullDate(selectedSlot.date)} at ${selectedSlot.time}<br>
    Instructor: ${ins ? ins.name : 'TBC'}
  `;
}

function confirmBooking() {
  const name = document.getElementById('student-name').value.trim();
  const email = document.getElementById('student-email').value.trim();
  const phone = document.getElementById('student-phone').value.trim();
  const pickup = document.getElementById('student-pickup').value.trim();
  const notes = document.getElementById('student-notes').value.trim();

  if (!name || !email || !phone) {
    showToast('Please fill in name, email and phone.', 'error');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  const lt = LESSON_TYPES.find(l => l.id === selectedLessonType);
  const booking = {
    id: 'bk_' + Date.now(),
    lessonTypeId: selectedLessonType,
    lessonName: lt.name,
    duration: lt.duration,
    price: lt.price,
    instructorId: selectedSlot.instructorId,
    date: selectedSlot.date,
    time: selectedSlot.time,
    studentName: name,
    studentEmail: email.toLowerCase(),
    studentPhone: phone,
    pickup,
    notes,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  const bookings = getBookings();
  bookings.push(booking);
  saveBookings(bookings);

  // Notify school email (opens user's email app with pre-filled message)
  const schoolEmail = 'amoakohenenanaowusu1@gmail.com';
  const ins = getInstructors().find(i => i.id === selectedSlot.instructorId);
  const subject = encodeURIComponent(`New Lesson Booking – ${name} – ${lt.name}`);
  const body = encodeURIComponent(
    `New booking received on Trust Driving Solution website:\n\n` +
    `Student: ${name}\n` +
    `Email: ${email}\n` +
    `Phone: ${phone}\n` +
    `Lesson: ${lt.name} (${lt.duration} min) – £${lt.price}\n` +
    `Date: ${formatFullDate(selectedSlot.date)}\n` +
    `Time: ${selectedSlot.time}\n` +
    `Instructor: ${ins ? ins.name : 'TBC'}\n` +
    `Pickup: ${pickup || 'Not specified'}\n` +
    `Notes: ${notes || 'None'}\n\n` +
    `Please confirm with the student.`
  );
  // Open mailto so the booking is sent to the school email
  window.open(`mailto:${schoolEmail}?subject=${subject}&body=${body}`, '_blank');

  showToast('Lesson booked! Notification prepared for ' + schoolEmail, 'success');

  // Reset form
  selectedLessonType = null;
  selectedSlot = null;
  document.getElementById('student-name').value = '';
  document.getElementById('student-email').value = '';
  document.getElementById('student-phone').value = '';
  document.getElementById('student-pickup').value = '';
  document.getElementById('student-notes').value = '';

  // Prefill lookup and go to schedule
  document.getElementById('lookup-email').value = email;
  setTimeout(() => {
    showSection('schedule');
    loadMyBookings();
  }, 800);
}

// ---------- My Schedule ----------
function loadMyBookings() {
  const email = document.getElementById('lookup-email').value.trim().toLowerCase();
  const list = document.getElementById('my-bookings-list');
  if (!email) {
    showToast('Please enter your email.', 'error');
    return;
  }

  const bookings = getBookings()
    .filter(b => b.studentEmail === email)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  if (bookings.length === 0) {
    list.innerHTML = `
      <div class="text-center py-12 text-slate-500">
        <i class="fas fa-inbox text-4xl mb-3 opacity-40"></i>
        <p>No lessons found for <strong>${email}</strong>.</p>
        <button onclick="showSection('book')" class="mt-4 text-trust-600 font-medium hover:underline">Book your first lesson</button>
      </div>
    `;
    return;
  }

  const instructors = getInstructors();
  const today = formatDate(new Date());

  list.innerHTML = bookings.map(b => {
    const ins = instructors.find(i => i.id === b.instructorId);
    const isPast = b.date < today;
    const isCancelled = b.status === 'cancelled';
    return `
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm ${isCancelled ? 'opacity-60' : ''}">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h4 class="font-semibold text-slate-900">${b.lessonName}</h4>
              ${isCancelled
                ? '<span class="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Cancelled</span>'
                : isPast
                  ? '<span class="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">Completed</span>'
                  : '<span class="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Confirmed</span>'
              }
            </div>
            <p class="text-sm text-slate-600">
              <i class="fas fa-calendar-day mr-1 text-slate-400"></i> ${formatFullDate(b.date)} at ${b.time}
            </p>
            <p class="text-sm text-slate-600">
              <i class="fas fa-user mr-1 text-slate-400"></i> ${ins ? ins.name : 'Instructor TBC'}
            </p>
            ${b.pickup ? `<p class="text-sm text-slate-500 mt-1"><i class="fas fa-map-marker-alt mr-1"></i> Pickup: ${b.pickup}</p>` : ''}
            ${b.notes ? `<p class="text-sm text-slate-500 mt-1"><i class="fas fa-sticky-note mr-1"></i> ${b.notes}</p>` : ''}
          </div>
          <div class="flex items-center gap-3">
            <span class="font-semibold text-slate-800">£${b.price}</span>
            ${!isCancelled && !isPast ? `
              <button onclick="cancelBooking('${b.id}')" class="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition">
                Cancel
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function cancelBooking(id) {
  if (!confirm('Are you sure you want to cancel this lesson?')) return;
  const bookings = getBookings();
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) return;
  bookings[idx].status = 'cancelled';
  saveBookings(bookings);
  showToast('Lesson cancelled. The time slot is now available again.', 'success');
  loadMyBookings();
  renderHeroSlots();
}

// ---------- Admin Panel ----------
function addAvailability() {
  const instructorId = document.getElementById('admin-instructor').value;
  const date = document.getElementById('admin-date').value;
  const start = document.getElementById('admin-start').value;
  const end = document.getElementById('admin-end').value;

  if (!date) {
    showToast('Please select a date.', 'error');
    return;
  }
  if (start >= end) {
    showToast('End time must be after start time.', 'error');
    return;
  }

  const avail = getAvailability();
  let added = 0;
  const startIdx = TIME_SLOTS.indexOf(start);
  const endIdx = TIME_SLOTS.indexOf(end);

  for (let i = startIdx; i < endIdx; i++) {
    const time = TIME_SLOTS[i];
    const exists = avail.some(a => a.instructorId === instructorId && a.date === date && a.time === time);
    if (!exists) {
      avail.push({
        id: `av_${instructorId}_${date}_${time}`,
        instructorId,
        date,
        time
      });
      added++;
    }
  }

  saveAvailability(avail);
  showToast(added > 0 ? `Added ${added} available slot(s).` : 'Those slots were already available.', added > 0 ? 'success' : 'info');
  renderAdminAvailability();
  renderHeroSlots();
}

function renderAdminBookings() {
  const container = document.getElementById('admin-bookings');
  const bookings = getBookings()
    .filter(b => b.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const instructors = getInstructors();
  const today = formatDate(new Date());

  if (bookings.length === 0) {
    container.innerHTML = '<p class="text-slate-500 text-sm py-4 text-center">No upcoming bookings yet.</p>';
    return;
  }

  container.innerHTML = bookings.map(b => {
    const ins = instructors.find(i => i.id === b.instructorId);
    const isPast = b.date < today;
    return `
      <div class="flex items-start gap-3 p-3 rounded-lg border border-slate-100 ${isPast ? 'bg-slate-50' : 'bg-white'}">
        <div class="w-10 h-10 rounded-lg ${ins ? ins.color : 'bg-slate-400'} flex items-center justify-center text-white text-xs font-bold shrink-0">
          ${ins ? ins.name.split(' ').map(n => n[0]).join('') : '?'}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-medium text-sm text-slate-900">${b.studentName}</span>
            <span class="text-xs text-slate-500">${b.lessonName}</span>
          </div>
          <p class="text-xs text-slate-600 mt-0.5">
            ${formatDisplayDate(b.date)} · ${b.time} · ${ins ? ins.name : 'TBC'}
          </p>
          ${b.pickup ? `<p class="text-xs text-slate-500">Pickup: ${b.pickup}</p>` : ''}
        </div>
        <span class="text-sm font-medium text-slate-700 shrink-0">£${b.price}</span>
      </div>
    `;
  }).join('');
}

function renderAdminAvailability() {
  const container = document.getElementById('admin-availability');
  const avail = getAvailability();
  const bookings = getBookings();
  const bookedKeys = new Set(
    bookings.filter(b => b.status !== 'cancelled').map(b => `${b.instructorId}|${b.date}|${b.time}`)
  );
  const instructors = getInstructors();
  const today = formatDate(new Date());
  const limit = formatDate(addDays(new Date(), 14));

  const open = avail
    .filter(a => a.date >= today && a.date <= limit && !bookedKeys.has(`${a.instructorId}|${a.date}|${a.time}`))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  if (open.length === 0) {
    container.innerHTML = '<p class="text-slate-500 py-3 text-center">No open slots in the next 14 days. Add some availability!</p>';
    return;
  }

  // Group by date
  const byDate = {};
  open.forEach(s => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });

  container.innerHTML = Object.keys(byDate).map(date => {
    const slots = byDate[date];
    return `
      <div class="border-b border-slate-100 pb-2 mb-2 last:border-0">
        <p class="font-medium text-slate-700 mb-1">${formatDisplayDate(date)}</p>
        <div class="flex flex-wrap gap-1">
          ${slots.map(s => {
            const ins = instructors.find(i => i.id === s.instructorId);
            return `<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-xs border border-emerald-100">
              ${s.time} <span class="text-emerald-600/70">· ${ins ? ins.name.split(' ')[0] : ''}</span>
            </span>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ---------- Toast ----------
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-slate-800'
  };
  const toast = document.createElement('div');
  toast.className = `toast ${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Boot
document.addEventListener('DOMContentLoaded', init);
