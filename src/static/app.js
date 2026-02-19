document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicate entries on re-render
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Generate participants list HTML (with delete button)
        const participantsList = details.participants.length > 0
          ? details.participants.map(email => `
            <li>
              <span class="participant-email">${email}</span>
              <button class="delete-participant" data-activity="${name}" data-email="${email}" aria-label="Remove participant">🗑️</button>
            </li>
          `).join('')
          : '<li style="color: #999; font-style: italic;">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants (${details.participants.length}/${details.max_participants})</h5>
            <ul class="participants-list">
              ${participantsList}
            </ul>
          </div>
        `;
        
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Delegate click handler for delete buttons
  activitiesList.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('delete-participant')) return;

    const btn = e.target;
    const activity = btn.dataset.activity;
    const email = btn.dataset.email;

    if (!confirm(`Remove ${email} from ${activity}?`)) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      );

      const result = await resp.json();

      if (resp.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'message success';
        messageDiv.classList.remove('hidden');
        // Re-fetch activities to update UI
        fetchActivities();
        setTimeout(() => messageDiv.classList.add('hidden'), 3000);
      } else {
        messageDiv.textContent = result.detail || 'Failed to remove participant';
        messageDiv.className = 'message error';
        messageDiv.classList.remove('hidden');
      }
    } catch (err) {
      messageDiv.textContent = 'Failed to remove participant';
      messageDiv.className = 'message error';
      messageDiv.classList.remove('hidden');
      console.error(err);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'message success';
        signupForm.reset();
        // Refresh activities to show the new participant immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = 'message error';
      }

      messageDiv.classList.remove('hidden');

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add('hidden');
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = 'message error';
      messageDiv.classList.remove('hidden');
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
