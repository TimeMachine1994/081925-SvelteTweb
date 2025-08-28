<footer class="footer">
	<div class="footer-container">
		<div class="footer-section">
			<h3 class="footer-heading">Tributestream®</h3>
			<p>
				Tributestream is a premier, affordable, and reliable livestreaming service to transport your
				families and friends to a celebration of life.
			</p>
			<p>We don't make videos, we make documentaries.</p>
			<a href="/register/funeral-director" class="footer-link">Funeral Director Form</a>
		</div>
		<div class="footer-section">
			<h3 class="footer-heading">COVERAGE LOCATIONS</h3>
			<p>Orange, Lake, Osceola, Seminole, Marion, Sumter, Volusia, Flagler, and Brevard counties.</p>
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
			<a href="https://google.com/search?q=tributestream" class="review-btn">Review Us</a>
		</div>
	</div>
	<div class="footer-bottom">
		<p>© {new Date().getFullYear()} All rights reserved | Tributestream is a Registered Trademark</p>
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
		color: #d4af37;
		text-decoration: none;
	}

	.footer-link:hover {
		text-decoration: underline;
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