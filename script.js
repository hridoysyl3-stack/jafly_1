/* ==========================================================================
   JAFLY SPORTS COMPLEX - MASTER APPLICATION SCRIPT
   Handles: Navigation, Interactive Turf Booking, LocalStorage Persistence,
   Phone Validation, Price Calculation, Café Filters, Gallery & Forms.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initBookingSystem();
  initFilterGrids();
  initCustomForms();
});

/* --------------------------------------------------------------------------
   1. MOBILE NAVIGATION
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navLinks');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      toggleBtn.textContent = navMenu.classList.contains('open') ? '✕' : '☰';
    });
  }
}

/* --------------------------------------------------------------------------
   2. TURF BOOKING ENGINE (booking.html)
   14 1-Hour Slots from 10:00 AM to 12:00 AM
   10:00 AM – 5:00 PM = ৳1,000/hr | 5:00 PM – 12:00 AM = ৳1,200/hr
   -------------------------------------------------------------------------- */
const TURF_SLOTS = [
  { id: 'slot-10', label: '10:00 AM – 11:00 AM', rate: 1000, period: 'Day' },
  { id: 'slot-11', label: '11:00 AM – 12:00 PM', rate: 1000, period: 'Day' },
  { id: 'slot-12', label: '12:00 PM – 01:00 PM', rate: 1000, period: 'Day' },
  { id: 'slot-13', label: '01:00 PM – 02:00 PM', rate: 1000, period: 'Day' },
  { id: 'slot-14', label: '02:00 PM – 03:00 PM', rate: 1000, period: 'Day' },
  { id: 'slot-15', label: '03:00 PM – 04:00 PM', rate: 1000, period: 'Day' },
  { id: 'slot-16', label: '04:00 PM – 05:00 PM', rate: 1000, period: 'Day' },
  { id: 'slot-17', label: '05:00 PM – 06:00 PM', rate: 1200, period: 'Night' },
  { id: 'slot-18', label: '06:00 PM – 07:00 PM', rate: 1200, period: 'Night' },
  { id: 'slot-19', label: '07:00 PM – 08:00 PM', rate: 1200, period: 'Night' },
  { id: 'slot-20', label: '08:00 PM – 09:00 PM', rate: 1200, period: 'Night' },
  { id: 'slot-21', label: '09:00 PM – 10:00 PM', rate: 1200, period: 'Night' },
  { id: 'slot-22', label: '10:00 PM – 11:00 PM', rate: 1200, period: 'Night' },
  { id: 'slot-23', label: '11:00 PM – 12:00 AM', rate: 1200, period: 'Night' }
];

const STORAGE_KEY = 'jafly_turf_bookings_v1';

function getTodayFormatted() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStoredBookings() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error parsing bookings:', e);
    }
  }
  // Seed realistic initial demo bookings for today so user sees booked slots immediately
  const today = getTodayFormatted();
  const seedData = {
    [today]: [
      { slotId: 'slot-18', customerName: 'Sylhet Strikers FC', phone: '01711000000', ref: 'JF-8821' },
      { slotId: 'slot-20', customerName: 'Jaflong United', phone: '01819000000', ref: 'JF-8849' }
    ]
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
  return seedData;
}

function saveStoredBookings(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function initBookingSystem() {
  const slotsContainer = document.getElementById('slotsGrid');
  const dateInput = document.getElementById('bookingDate');
  const bookingForm = document.getElementById('turfBookingForm');
  const resetDemoBtn = document.getElementById('resetDemoBtn');

  if (!slotsContainer || !dateInput || !bookingForm) return;

  const today = getTodayFormatted();
  dateInput.value = today;
  dateInput.min = today;

  let selectedSlotIds = [];

  function renderSlots() {
    const chosenDate = dateInput.value;
    const allBookings = getStoredBookings();
    const bookedForDate = allBookings[chosenDate] || [];
    const bookedSlotIds = bookedForDate.map(b => b.slotId);

    // Clear selections that might have become invalid on date switch
    slotsContainer.innerHTML = '';

    TURF_SLOTS.forEach(slot => {
      const isBooked = bookedSlotIds.includes(slot.id);
      const isSelected = selectedSlotIds.includes(slot.id);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `slot-btn ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`;
      btn.disabled = isBooked;

      const badgeClass = isBooked
        ? 'tag-taken'
        : slot.period === 'Day'
        ? 'tag-day'
        : 'tag-night';

      const badgeText = isBooked
        ? 'Booked'
        : slot.period === 'Day'
        ? 'Day Rate'
        : 'Floodlight';

      btn.innerHTML = `
        <div class="slot-time">${slot.label}</div>
        <div class="slot-meta">
          <span class="slot-rate">৳${slot.rate.toLocaleString()}</span>
          <span class="slot-status-tag ${badgeClass}">${badgeText}</span>
        </div>
      `;

      if (!isBooked) {
        btn.addEventListener('click', () => {
          if (selectedSlotIds.includes(slot.id)) {
            selectedSlotIds = selectedSlotIds.filter(id => id !== slot.id);
          } else {
            selectedSlotIds.push(slot.id);
          }
          renderSlots();
          updateSummary();
        });
      }

      slotsContainer.appendChild(btn);
    });
  }

  function updateSummary() {
    const summaryDateEl = document.getElementById('summaryDate');
    const summarySlotsEl = document.getElementById('summarySlots');
    const summaryHoursEl = document.getElementById('summaryHours');
    const summaryTotalEl = document.getElementById('summaryTotal');

    summaryDateEl.textContent = dateInput.value || '—';

    if (selectedSlotIds.length === 0) {
      summarySlotsEl.innerHTML = '<span style="color: var(--gray-muted);">No slots selected yet</span>';
      summaryHoursEl.textContent = '0 Hours';
      summaryTotalEl.textContent = '৳0';
      return;
    }

    const chosenObjects = TURF_SLOTS.filter(s => selectedSlotIds.includes(s.id));
    const totalTaka = chosenObjects.reduce((sum, item) => sum + item.rate, 0);

    summarySlotsEl.innerHTML = chosenObjects
      .map(s => `<div style="font-size:0.84rem; margin-bottom:3px;">• ${s.label} (৳${s.rate.toLocaleString()})</div>`)
      .join('');

    summaryHoursEl.textContent = `${chosenObjects.length} ${chosenObjects.length === 1 ? 'Hour' : 'Hours'}`;
    summaryTotalEl.textContent = `৳${totalTaka.toLocaleString()}`;
  }

  dateInput.addEventListener('change', () => {
    selectedSlotIds = [];
    document.getElementById('bookingConfirmation').style.display = 'none';
    renderSlots();
    updateSummary();
  });

  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      selectedSlotIds = [];
      document.getElementById('bookingConfirmation').style.display = 'none';
      renderSlots();
      updateSummary();
      alert('Demo bookings reset to default state!');
    });
  }

  bookingForm.addEventListener('submit', e => {
    e.preventDefault();

    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const teamInput = document.getElementById('customerTeam');
    const formatInput = document.getElementById('matchFormat');

    const slotError = document.getElementById('slotError');
    const nameError = document.getElementById('nameError');
    const phoneError = document.getElementById('phoneError');

    slotError.style.display = 'none';
    nameError.style.display = 'none';
    phoneError.style.display = 'none';

    let valid = true;

    if (selectedSlotIds.length === 0) {
      slotError.style.display = 'block';
      valid = false;
    }

    const fullName = nameInput.value.trim();
    if (fullName.length < 3) {
      nameError.style.display = 'block';
      valid = false;
    }

    // Validate Bangladeshi mobile number: 013-019 followed by 8 digits (with optional +88)
    const rawPhone = phoneInput.value.trim().replace(/[\s-]/g, '');
    const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(rawPhone)) {
      phoneError.style.display = 'block';
      valid = false;
    }

    if (!valid) return;

    // Double-check against race condition in storage
    const chosenDate = dateInput.value;
    const allBookings = getStoredBookings();
    if (!allBookings[chosenDate]) {
      allBookings[chosenDate] = [];
    }

    const alreadyBookedIds = allBookings[chosenDate].map(b => b.slotId);
    const conflict = selectedSlotIds.some(id => alreadyBookedIds.includes(id));

    if (conflict) {
      alert('One or more selected slots have just been booked. Please select available slots.');
      selectedSlotIds = [];
      renderSlots();
      updateSummary();
      return;
    }

    // Save booking
    const bookingRef = 'JF-' + Math.floor(100000 + Math.random() * 900000);
    const chosenObjects = TURF_SLOTS.filter(s => selectedSlotIds.includes(s.id));
    const totalAmount = chosenObjects.reduce((sum, item) => sum + item.rate, 0);

    selectedSlotIds.forEach(slotId => {
      allBookings[chosenDate].push({
        slotId,
        customerName: fullName,
        phone: rawPhone,
        team: teamInput.value.trim() || 'General Booking',
        format: formatInput.value,
        ref: bookingRef
      });
    });

    saveStoredBookings(allBookings);

    // Render Confirmation Receipt
    const confBox = document.getElementById('bookingConfirmation');
    confBox.innerHTML = `
      <h3 style="color: var(--success); margin-bottom: 0.5rem;">✓ Turf Booking Confirmed!</h3>
      <p style="font-size: 0.9rem; color: var(--gray-light); margin-bottom: 1rem;">
        Your slot(s) are now locked in our system. Show this reference at the JAFLY Reception Desk.
      </p>
      <div class="summary-line"><span>Booking Reference:</span><strong>${bookingRef}</strong></div>
      <div class="summary-line"><span>Customer Name:</span><strong>${fullName}</strong></div>
      <div class="summary-line"><span>Phone Number:</span><strong>${rawPhone}</strong></div>
      <div class="summary-line"><span>Match Date:</span><strong>${chosenDate}</strong></div>
      <div class="summary-line"><span>Match Format:</span><strong>${formatInput.value}</strong></div>
      <div class="summary-line"><span>Booked Slots:</span><strong>${chosenObjects.map(s => s.label).join('<br>')}</strong></div>
      <div class="summary-total" style="border-top-color: var(--success);">
        <span>Total Payable:</span>
        <span style="color: var(--success);">৳${totalAmount.toLocaleString()}</span>
      </div>
    `;
    confBox.style.display = 'block';

    // Reset current selection and re-render so newly booked slots turn locked immediately
    selectedSlotIds = [];
    bookingForm.reset();
    renderSlots();
    updateSummary();
    confBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  renderSlots();
  updateSummary();
}

/* --------------------------------------------------------------------------
   3. CATEGORY FILTERING (Café Menu & Gallery)
   -------------------------------------------------------------------------- */
function initFilterGrids() {
  const filterButtons = document.querySelectorAll('[data-filter-group]');
  if (filterButtons.length === 0) return;

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const groupName = btn.getAttribute('data-filter-group');
      const targetCategory = btn.getAttribute('data-filter');

      // Update active state for buttons in this group
      document.querySelectorAll(`[data-filter-group="${groupName}"]`).forEach(b => {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      // Filter items
      const items = document.querySelectorAll(`[data-item-group="${groupName}"]`);
      items.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if (targetCategory === 'all' || itemCategory === targetCategory) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   4. TOURNAMENT & CONTACT FORMS
   -------------------------------------------------------------------------- */
function initCustomForms() {
  const tourneyForm = document.getElementById('tournamentRegForm');
  if (tourneyForm) {
    tourneyForm.addEventListener('submit', e => {
      e.preventDefault();
      const teamName = document.getElementById('regTeamName').value;
      const captain = document.getElementById('regCaptain').value;
      const phone = document.getElementById('regPhone').value;
      const eventName = document.getElementById('regEvent').value;

      const output = document.getElementById('tourneyRegSuccess');
      output.innerHTML = `
        <h4 style="color: var(--success); margin-bottom:0.35rem;">✓ Team Registration Received!</h4>
        <p style="font-size:0.9rem;">
          <strong>${teamName}</strong> (Captain: ${captain}, Phone: ${phone}) has been registered for <strong>${eventName}</strong>.
          Our Tournament Committee will call you within 24 hours to verify your squad list.
        </p>
      `;
      output.style.display = 'block';
      tourneyForm.reset();
    });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('contactName').value;
      const feedback = document.getElementById('contactSuccess');
      feedback.innerHTML = `
        <h4 style="color: var(--success);">✓ Message Sent Successfully!</h4>
        <p style="font-size:0.9rem;">Thank you, <strong>${name}</strong>. The JAFLY Sports Complex front desk in Jaflong will respond shortly.</p>
      `;
      feedback.style.display = 'block';
      contactForm.reset();
    });
  }
}