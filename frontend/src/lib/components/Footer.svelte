<script lang="ts">
	import { user } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';

	const theme = getTheme('minimal');

	function handleEventPlannerClick() {
		if ($user) {
			// User is logged in - check their role
			if ($user.role === 'funeral_director' || $user.role === 'admin') {
				// Event planner or admin - go to quick registration tool
				goto('/register/event-planner');
			} else {
				// Other logged-in users - go to event planner information page
				goto('/for-event-planners');
			}
		} else {
			// User not logged in - go to event planner information page
			goto('/for-event-planners');
		}
	}
</script>

<footer class="footer">
	<div class="footer-container">
		<div class="footer-section">
			<h3 class="footer-heading">Tributestream Live®</h3>
			<p>
				Tributestream Live is a premier, affordable, and reliable livestreaming service to bring your
				family and friends together for life's special moments and celebrations.
			</p>
			<p>We don't just stream events, we capture memories.</p>
			<button onclick={handleEventPlannerClick} class="footer-link event-planner-btn"
				>Event Planner Form</button
			>
		</div>
		<div class="footer-section">
			<h3 class="footer-heading">COVERAGE LOCATIONS</h3>
			<p>
				Orange, Lake, Osceola, Seminole, Marion, Sumter, Volusia, Flagler, and Brevard counties.
			</p>
			<p>Please call if your location is not listed:</p>
			<p>(407) 221-5922</p>
			<p>Email: Contact@tributestream.com</p>
		</div>
		<div class="footer-section">
			<h3 class="footer-heading">Office Hours</h3>
			<p>Monday - Friday: 10:00AM - 5:00PM EST</p>
			<p>Saturday - Sunday: 12:00PM - 5:00PM EST</p>
			<h3 class="footer-heading">After Hours</h3>
			<p>If you need to contact us after hours, feel free to reach out via text or email.</p>
		</div>
		<div class="footer-section">
			<h3 class="footer-heading">REVIEW US ON GOOGLE</h3>
			<p>
				If you appreciated the service we provided you and your family please consider leaving us a
				five-star review on Google!
			</p>
			<a href="https://g.page/r/CT2e1k0NJGeKEBM/review" class="review-btn" target="_blank" rel="noopener noreferrer">Review Us</a>
		</div>
	</div>
	<div class="footer-bottom">
		<p>
			{new Date().getFullYear()} All rights reserved | Tributestream Live is a Registered Trademark
		</p>
	</div>
</footer>

<style>
	.footer {
		background-color: #0a0a1a;
		color: #e0e0e0;
		padding: 4rem 2rem;
	}

	.footer-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		padding-bottom: 2rem;
		border-bottom: 1px solid #444;
	}

	.footer-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.footer-heading {
		font-size: 1.2rem;
		font-weight: bold;
		color: white;
		margin-bottom: 0.5rem;
	}

	.footer-link {
		color: #60A5FA;
		text-decoration: none;
	}

	.footer-link:hover {
		text-decoration: underline;
	}

	.event-planner-btn {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		cursor: pointer;
		text-align: left;
	}

	.review-btn {
		display: inline-block;
		padding: 0.5rem 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		color: #e0e0e0;
		text-decoration: none;
		text-align: center;
		margin-top: 1rem;
		transition:
			background-color 0.3s,
			color 0.3s;
	}

	.review-btn:hover {
		background-color: #e0e0e0;
		color: #0a0a1a;
	}

	.footer-bottom {
		text-align: center;
		padding-top: 2rem;
		font-size: 0.9rem;
	}
</style>
