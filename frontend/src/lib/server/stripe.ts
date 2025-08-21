import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2025-07-30.basil'
});