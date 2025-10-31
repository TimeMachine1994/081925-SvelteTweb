/**
 * Demo Data Templates and Interfaces
 * Used for seeding realistic data in demo sessions
 */

export interface DemoMemorialTemplate {
	fullName: string;
	dateOfBirth: string;
	dateOfDeath: string;
	biography: string;
	profilePhotoUrl?: string;
	coverPhotoUrl?: string;
	obituaryText?: string;
	funeralHomeInfo?: {
		name: string;
		address: string;
		phone: string;
	};
	serviceInfo?: {
		date: string;
		time: string;
		location: string;
		address: string;
	};
}

export interface DemoStreamTemplate {
	title: string;
	description: string;
	scheduledStartTime?: string;
	isScheduled: boolean;
}

export interface DemoSlideshowPhoto {
	url: string;
	caption?: string;
	order: number;
}

export interface DemoSlideshowTemplate {
	title: string;
	photos: DemoSlideshowPhoto[];
	settings: {
		transitionDuration: number;
		photoDuration: number;
		transitionType: 'fade' | 'slide' | 'zoom';
	};
}

export interface DemoCondolence {
	authorName: string;
	message: string;
	relationship?: string;
	isPublic: boolean;
	createdAt: Date;
}

export interface DemoScenarioData {
	memorial: DemoMemorialTemplate;
	streams: DemoStreamTemplate[];
	slideshows?: DemoSlideshowTemplate[];
	condolences?: DemoCondolence[];
}

/**
 * Scenario-specific templates
 */
export const DEMO_SCENARIOS: Record<string, DemoScenarioData> = {
	first_memorial_service: {
		memorial: {
			fullName: 'Eleanor Marie Thompson',
			dateOfBirth: '1942-03-15',
			dateOfDeath: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
			biography: `Eleanor Marie Thompson was a beloved mother, grandmother, and retired teacher who touched countless lives during her 81 years. Born in Springfield, she dedicated 35 years to teaching elementary school, where she was known for her warm smile and patient guidance.

She loved gardening, baking her famous apple pie, and spending time with her four grandchildren. Eleanor was an active member of her community, volunteering at the local library and organizing book clubs for seniors.

She is survived by her children, Michael and Sarah, and four grandchildren who will cherish her memory forever.`,
			obituaryText: 'Eleanor Marie Thompson, 81, of Springfield, passed away peacefully on [date] surrounded by her loving family. A celebration of life service will be held on [date] at [location].',
			funeralHomeInfo: {
				name: 'Springfield Memorial Chapel',
				address: '123 Oak Street, Springfield, IL 62701',
				phone: '(217) 555-0123'
			},
			serviceInfo: {
				date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
				time: '14:00',
				location: 'Springfield Memorial Chapel',
				address: '123 Oak Street, Springfield, IL 62701'
			}
		},
		streams: [
			{
				title: 'Memorial Service for Eleanor Thompson',
				description: 'Live stream of the memorial service celebration of life',
				scheduledStartTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
				isScheduled: true
			}
		],
		condolences: [
			{
				authorName: 'Robert Jensen',
				message: 'Mrs. Thompson was my 3rd grade teacher and inspired my love of reading. She will be deeply missed.',
				relationship: 'Former Student',
				isPublic: true,
				createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
			},
			{
				authorName: 'Patricia Williams',
				message: 'Eleanor was a wonderful friend and neighbor. Her kindness and wisdom touched everyone she met.',
				relationship: 'Friend',
				isPublic: true,
				createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
			}
		]
	},

	managing_multiple: {
		memorial: {
			fullName: 'James Robert Mitchell',
			dateOfBirth: '1955-07-22',
			dateOfDeath: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
			biography: `James Robert Mitchell, 68, was a devoted husband, father, and successful entrepreneur who founded Mitchell & Sons Construction in 1985. His company built over 200 homes in the tri-county area and employed dozens of local workers.

Known for his integrity and craftsmanship, James took pride in every project. He was an avid fisherman, golf enthusiast, and mentor to young builders entering the trade.

He leaves behind his wife of 42 years, Linda, three children, and seven grandchildren who will continue his legacy of hard work and family values.`,
			obituaryText: 'James Robert Mitchell, 68, passed away on [date]. A visitation will be held on [date] followed by a funeral service on [date].',
			funeralHomeInfo: {
				name: 'Riverside Funeral Home',
				address: '456 River Road, Riverside, TX 77401',
				phone: '(281) 555-0456'
			},
			serviceInfo: {
				date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				time: '11:00',
				location: 'Riverside Funeral Home',
				address: '456 River Road, Riverside, TX 77401'
			}
		},
		streams: [
			{
				title: 'Visitation - James Mitchell',
				description: 'Evening visitation service',
				scheduledStartTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString(),
				isScheduled: true
			},
			{
				title: 'Funeral Service - James Mitchell',
				description: 'Memorial service at Riverside Chapel',
				scheduledStartTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
				isScheduled: true
			}
		],
		condolences: [
			{
				authorName: 'Thomas Anderson',
				message: 'James was not just my boss, but a mentor and friend. His legacy will live on through the homes he built and the lives he touched.',
				relationship: 'Employee',
				isPublic: true,
				createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
			},
			{
				authorName: 'Susan Carter',
				message: 'Our family is so grateful to James for building our dream home 15 years ago. His craftsmanship and care were exceptional.',
				relationship: 'Client',
				isPublic: true,
				createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
			},
			{
				authorName: 'David Mitchell',
				message: 'Dad, you taught us the value of hard work, integrity, and family. We love you and will miss you every day.',
				relationship: 'Son',
				isPublic: true,
				createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
			}
		]
	},

	legacy_celebration: {
		memorial: {
			fullName: 'Dorothy Grace Wilson',
			dateOfBirth: '1928-12-10',
			dateOfDeath: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks ago
			biography: `Dorothy Grace Wilson, 95, lived a remarkable life filled with love, adventure, and service to others. Born during the Great Depression, she grew up learning the values of resilience and compassion that would define her life.

During World War II, Dorothy served as a nurse, caring for wounded soldiers. After the war, she married her sweetheart, William Wilson, and together they raised five children while she continued her nursing career for 45 years.

Dorothy was known for her storytelling, her delicious Sunday dinners, and her unwavering faith. She volunteered at the veterans' hospital well into her 80s and touched thousands of lives with her kindness and wisdom.

She is survived by 5 children, 12 grandchildren, 18 great-grandchildren, and countless friends whose lives she enriched. Her legacy of love, service, and strength will continue through the generations she inspired.`,
			obituaryText: 'Dorothy Grace Wilson, 95, passed away peacefully on [date] surrounded by her loving family. A celebration of her remarkable life will be held on [date].',
			funeralHomeInfo: {
				name: 'Heritage Memorial Gardens',
				address: '789 Heritage Lane, Lakeside, CA 92040',
				phone: '(619) 555-0789'
			},
			serviceInfo: {
				date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Service was 1 week ago
				time: '15:00',
				location: 'Heritage Memorial Gardens',
				address: '789 Heritage Lane, Lakeside, CA 92040'
			}
		},
		streams: [
			{
				title: 'Celebration of Life - Dorothy Wilson',
				description: 'A celebration of 95 remarkable years',
				isScheduled: false // Already completed
			}
		],
		slideshows: [
			{
				title: 'Dorothy\'s Life Journey - 95 Years of Love',
				photos: [
					{ url: '/demo-assets/dorothy-1.jpg', caption: 'Dorothy as a young nurse during WWII, 1943', order: 0 },
					{ url: '/demo-assets/dorothy-2.jpg', caption: 'Wedding day with William, 1946', order: 1 },
					{ url: '/demo-assets/dorothy-3.jpg', caption: 'With her five children, 1965', order: 2 },
					{ url: '/demo-assets/dorothy-4.jpg', caption: 'Nursing career - receiving 40-year service award, 1985', order: 3 },
					{ url: '/demo-assets/dorothy-5.jpg', caption: 'Family reunion with all grandchildren, 2010', order: 4 },
					{ url: '/demo-assets/dorothy-6.jpg', caption: '90th birthday celebration, 2018', order: 5 },
					{ url: '/demo-assets/dorothy-7.jpg', caption: 'Recent photo with great-grandchildren, 2023', order: 6 }
				],
				settings: {
					transitionDuration: 1000,
					photoDuration: 5000,
					transitionType: 'fade'
				}
			}
		],
		condolences: [
			{
				authorName: 'Margaret Johnson',
				message: 'Aunt Dorothy was the matriarch of our family. Her stories, wisdom, and love shaped all of us. Heaven gained an angel.',
				relationship: 'Niece',
				isPublic: true,
				createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
			},
			{
				authorName: 'Dr. Richard Chen',
				message: 'Dorothy volunteered at our veterans hospital for over 30 years. Her compassion and dedication were unmatched. We will miss her dearly.',
				relationship: 'Hospital Administrator',
				isPublic: true,
				createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
			},
			{
				authorName: 'Emily Wilson Parker',
				message: 'Grandma Dorothy, your love continues to live in all of us. Thank you for teaching us what it means to live a life of purpose and joy.',
				relationship: 'Granddaughter',
				isPublic: true,
				createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
			},
			{
				authorName: 'Father Michael O\'Brien',
				message: 'Dorothy\'s faith and service to our parish community were an inspiration. She lived the Gospel every day of her life.',
				relationship: 'Parish Priest',
				isPublic: true,
				createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
			}
		]
	},

	viewer_experience: {
		memorial: {
			fullName: 'Michael Anthony Rodriguez',
			dateOfBirth: '1960-08-30',
			dateOfDeath: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 weeks ago
			biography: `Michael Anthony Rodriguez, 63, was a beloved coach, teacher, and community leader who dedicated his life to inspiring young people. For 35 years, he taught history at Lincoln High School and coached the varsity baseball team to three state championships.

Coach Rodriguez, as he was affectionately known, believed in the potential of every student. He started an after-school mentorship program that helped hundreds of at-risk youth find their path. His motto was "Everyone deserves a champion," and he lived that philosophy every day.

Beyond the classroom, Michael was a devoted husband to Maria, proud father to his three children, and an enthusiastic grandfather who never missed a grandkid's game or recital.

His impact on the community will be felt for generations to come through the countless lives he touched, mentored, and inspired.`,
			obituaryText: 'Michael Anthony Rodriguez, 63, passed away on [date]. A public memorial service was held on [date] at Lincoln High School, where hundreds gathered to honor his legacy.',
			funeralHomeInfo: {
				name: 'Community Memorial Services',
				address: '321 Community Drive, Westfield, NJ 07090',
				phone: '(908) 555-0321'
			},
			serviceInfo: {
				date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks ago
				time: '16:00',
				location: 'Lincoln High School Gymnasium',
				address: '500 Lincoln Avenue, Westfield, NJ 07090'
			}
		},
		streams: [
			{
				title: 'Memorial Service - Coach Rodriguez',
				description: 'Community celebration of life at Lincoln High School',
				isScheduled: false // Already completed
			}
		],
		slideshows: [
			{
				title: 'Coach Rodriguez - A Life of Service',
				photos: [
					{ url: '/demo-assets/coach-1.jpg', caption: 'First day as a teacher, 1988', order: 0 },
					{ url: '/demo-assets/coach-2.jpg', caption: 'State Championship win, 1995', order: 1 },
					{ url: '/demo-assets/coach-3.jpg', caption: 'With the baseball team', order: 2 },
					{ url: '/demo-assets/coach-4.jpg', caption: 'Starting the mentorship program, 2005', order: 3 },
					{ url: '/demo-assets/coach-5.jpg', caption: 'Family photo with Maria and the kids', order: 4 }
				],
				settings: {
					transitionDuration: 800,
					photoDuration: 4000,
					transitionType: 'slide'
				}
			}
		],
		condolences: [
			{
				authorName: 'Principal Jennifer Martinez',
				message: 'Coach Rodriguez was the heart of Lincoln High School. His dedication to our students was unmatched. He will be deeply missed.',
				relationship: 'Principal',
				isPublic: true,
				createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
			},
			{
				authorName: 'Marcus Johnson',
				message: 'Coach believed in me when no one else did. He saved my life and put me on the path to college. I owe everything to him.',
				relationship: 'Former Student',
				isPublic: true,
				createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000)
			},
			{
				authorName: 'Sarah Chen',
				message: 'Mr. Rodriguez made history come alive. His classes weren\'t just about dates and facts - they were about understanding humanity.',
				relationship: 'Former Student',
				isPublic: true,
				createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000)
			},
			{
				authorName: 'The Rodriguez Family',
				message: 'To all who knew Mike - thank you for the outpouring of love and support. Your stories remind us of the incredible impact he had on so many lives.',
				relationship: 'Family',
				isPublic: true,
				createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
			},
			{
				authorName: 'Anonymous',
				message: 'Coach Rodriguez changed my life. I was heading down the wrong path, and he never gave up on me. Rest in peace, Coach.',
				relationship: 'Former Student',
				isPublic: true,
				createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
			}
		]
	}
};
