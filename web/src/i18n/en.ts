import type { Strings } from './index';

// English website copy (PRD §7). Complete, not a summary: Meta reviewers read English.
export const en: Strings = {
  languageName: 'English',
  otherLocale: 'fa',
  brand: 'Trust Me',
  skipLink: 'Skip to content',
  nav: {
    home: 'Home',
    privacy: 'Privacy',
    terms: 'Terms',
    dataDeletion: 'Data deletion',
    label: 'Legal pages',
  },
  titles: {
    home: 'Trust Me: check an Instagram page before you buy',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    dataDeletion: 'Data Deletion',
    deletionStatus: 'Deletion Request Status',
    notFound: 'Page not found',
  },
  home: {
    eyebrow: 'Instagram DM assistant',
    title: 'Before you buy from an Instagram page, ask us about it.',
    lede:
      'Send {handle} a page or one of its posts in a direct message. We reply with what reviewer pages have published about it: their review posts, the page’s status and links you can check yourself.',
    cta: 'Message {handle} on Instagram',
    ctaNote: 'Free. Works inside Instagram, no sign-up.',
    example: {
      label: 'Example conversation',
      caption: 'An illustration of the reply format. The page and review shown are not real.',
      shared: '@sample.shop',
      reply: [
        'Sample Shop (@sample.shop)',
        'Status: Recommended (tested)',
        'Reviews:',
        '• @reviewer.page: order arrived on time and matched the photos.',
        'instagram.com/p/…',
      ],
    },
    how: {
      title: 'How it works',
      intro: 'Three steps, all inside your Instagram inbox.',
      steps: [
        {
          title: 'Send us the page',
          body: 'Share the page’s profile or one of its posts with {handle}, or type its handle with @.',
        },
        {
          title: 'We find who posted it',
          body: 'If you send a post, we look up the account that published it. We answer about the post’s author, not the accounts tagged in it.',
        },
        {
          title: 'You get what we know',
          body: 'If we have reviewed the page, we reply with its status and the newest review posts. If not, we add it to our review list and tell you so.',
        },
      ],
    },
    sources: {
      title: 'Where the answers come from',
      items: [
        {
          title: 'Published reviews, checked by a person',
          body: 'We follow Instagram pages that review online shops. A person on our team reads each new review and approves it before the bot ever repeats it.',
        },
        {
          title: 'Information, not a guarantee',
          body: 'An answer tells you what has been published, with links to the original posts. No reviews does not mean a page is safe or unsafe. The decision to buy is yours.',
        },
      ],
    },
    privacy:
      'We use your message only to answer it, and delete our message logs after 90 days. Read the [privacy policy](privacy).',
  },
  legal: {
    updatedLabel: 'Last updated',
    updated: '23 October 2026',
    contentsLabel: 'On this page',
  },
  privacy: {
    intro: [
      'This policy explains what Trust Me collects when you send a direct message to our Instagram account {handle}, why, how long we keep it, and how to have it deleted. Trust Me is operated by {company}.',
    ],
    sections: [
      {
        id: 'who',
        heading: 'Who we are',
        body: [
          'The Trust Me app is an Instagram messaging assistant operated by {company} ("we", "us"). It answers questions about Instagram shop pages using reviews published by independent reviewer pages. You can reach us at {email}.',
        ],
      },
      {
        id: 'collect',
        heading: 'What we collect',
        body: [
          'When you send a direct message to {handle}, Instagram passes the message to our app. From it we receive:',
          {
            list: [
              'Your Instagram-scoped user ID: a number Instagram gives our app to identify the conversation. It is not your username, and we do not receive your password.',
              'Your message and what you shared in it, such as a profile, a post or a link.',
              'Timestamps: when the message arrived and when we replied.',
            ],
          },
          'From each message we keep a log entry with your Instagram-scoped user ID, the time, the type of content you sent, the page handle we looked up and what we answered. We do not keep the full text of your message in this log. While a message is being processed, it is held in our processing queue, which removes it automatically within 7 days.',
          'We do not receive your contacts, your other conversations, your location or anything else from your Instagram account.',
          'When you ask about a page we have not reviewed, we add that page’s handle to our review list and count how many times it was asked about. The review list does not record who asked.',
          'This website does not use cookies, analytics or advertising trackers. Our server keeps standard technical logs (such as IP address, time and the page requested) for security and troubleshooting.',
        ],
      },
      {
        id: 'why',
        heading: 'Why we use it',
        body: [
          'We use this information only to answer your question: to read what you sent, look up the page, reply to you in the same conversation, and stop the same message from being answered twice. We also use it to limit how many messages one account can trigger, to protect the service from abuse.',
        ],
      },
      {
        id: 'retention',
        heading: 'How long we keep it',
        body: [
          'Message log entries are deleted automatically 90 days after the message arrived. Messages in the processing queue are removed within 7 days. If you ask us to delete your data, we delete it sooner (see below).',
        ],
      },
      {
        id: 'sharing',
        heading: 'Who we share it with',
        body: [
          'We do not sell, rent or trade your information, and we do not use it for advertising or profiling.',
          'Your message reaches us through Meta’s Instagram platform, and our servers are run by hosting providers who process data only on our behalf. To learn who published a post, we send the public post link (never your ID or message) to Apify, a service that reads public Instagram information. We may disclose information if the law requires it.',
        ],
      },
      {
        id: 'deletion',
        heading: 'Deleting your data',
        body: [
          'You can ask us to delete your data at any time. The steps are on our [data deletion page](data-deletion).',
        ],
      },
      {
        id: 'security',
        heading: 'Security',
        body: [
          'Access to our systems is limited to our team and protected with two-step verification. Access tokens are stored encrypted. No system is perfectly secure, but we work to protect your information.',
        ],
      },
      {
        id: 'children',
        heading: 'Children',
        body: [
          'Trust Me is not intended for anyone under the minimum age Instagram requires to have an account.',
        ],
      },
      {
        id: 'changes',
        heading: 'Changes to this policy',
        body: [
          'If we change this policy, we will update this page and the date at the top.',
        ],
      },
      {
        id: 'contact',
        heading: 'Contact',
        body: ['Questions about this policy or your data: {email}.'],
      },
    ],
  },
  terms: {
    intro: [
      'These terms apply when you use Trust Me, the Instagram messaging assistant at {handle}, and this website. Trust Me is operated by {company}. By sending us a message you agree to these terms.',
    ],
    sections: [
      {
        id: 'service',
        heading: 'The service',
        body: [
          'Trust Me answers questions about Instagram pages. You send us a page or a post; we reply with information we hold about that page, such as review posts published by reviewer pages we follow, a status label and links. The service is free.',
        ],
      },
      {
        id: 'informational',
        heading: 'Answers are informational only',
        body: [
          'Our answers summarise what others have published. They are provided for information only and are not a guarantee, endorsement or warning about any business, and they are not legal, financial or professional advice.',
          {
            list: [
              'Reviews are written by independent reviewer pages, not by us. We check them before showing them, but we cannot verify every claim.',
              'Information can be incomplete or out of date. A page can change its owner, its handle or how it does business.',
              'If we have no reviews of a page, that says nothing about whether it is safe or unsafe.',
              'You are responsible for your own decisions about buying from any page.',
            ],
          },
        ],
      },
      {
        id: 'use',
        heading: 'Using the service',
        body: [
          'Please use Trust Me for its purpose: asking about pages. Do not send spam, automated messages or unlawful content, and do not try to disrupt the service. We limit how many messages one account can trigger and may stop answering an account that abuses the service. You must also follow Instagram’s own terms.',
        ],
      },
      {
        id: 'third-party',
        heading: 'Third-party content and links',
        body: [
          'Review posts belong to the reviewer pages that published them. Our answers link to Instagram, which we do not control. Trust Me is not affiliated with, endorsed by or sponsored by Meta or Instagram.',
        ],
      },
      {
        id: 'corrections',
        heading: 'Corrections',
        body: [
          'If you run a page and believe something we show about it is wrong, email {email} with your page handle and the details. We will review it and correct or remove information that is inaccurate.',
        ],
      },
      {
        id: 'privacy',
        heading: 'Privacy',
        body: ['How we handle your information is described in our [privacy policy](privacy).'],
      },
      {
        id: 'availability',
        heading: 'Availability and changes',
        body: [
          'We may change, pause or stop the service at any time. We may update these terms; the date at the top shows the latest version, and continuing to use the service means you accept the update.',
        ],
      },
      {
        id: 'liability',
        heading: 'Limitation of liability',
        body: [
          'The service is provided "as is". To the extent the law allows, we are not liable for any loss arising from your use of the service or from decisions made based on its answers.',
        ],
      },
      {
        id: 'contact',
        heading: 'Contact',
        body: ['Questions about these terms: {email}.'],
      },
    ],
  },
  dataDeletion: {
    intro: [
      'You can ask us to delete the data Trust Me holds about you at any time. This page explains how, what gets deleted and how long it takes.',
    ],
    sections: [
      {
        id: 'what',
        heading: 'What we hold',
        body: [
          'When you message {handle}, we keep a log entry for each message: your Instagram-scoped user ID, the time, the type of content you sent, the page we looked up and what we answered. These entries are deleted automatically after 90 days. Details are in our [privacy policy](privacy).',
        ],
      },
      {
        id: 'how',
        heading: 'How to request deletion',
        body: [
          'Choose any one of these options:',
          {
            steps: [
              'Remove the app in Instagram: open Instagram, go to Settings, then Website permissions, then Apps and websites. Find Trust Me under Active and choose Remove. Instagram tells us, we delete your data automatically, and you receive a confirmation code.',
              'Send a direct message to {handle} saying you want your data deleted.',
              'Email {email} with your Instagram username and a request to delete your data.',
            ],
          },
        ],
      },
      {
        id: 'deleted',
        heading: 'What gets deleted',
        body: [
          'All message log entries linked to your Instagram-scoped user ID. To prove the request was handled, we keep only the confirmation code, its status and a one-way coded form of your ID that cannot be turned back into the ID.',
          'Page handles on our review list are not linked to you and are not affected.',
        ],
      },
      {
        id: 'time',
        heading: 'How long it takes',
        body: [
          'When you remove the app in Instagram, deletion runs as soon as Instagram notifies us, usually within minutes. Requests made by direct message or email are completed within 30 days. We confirm by the same channel you used.',
        ],
      },
    ],
  },
  deletion: {
    checkTitle: 'Check a deletion request',
    checkHelp: 'Enter the confirmation code you received after removing the app.',
    checkLabel: 'Confirmation code',
    checkButton: 'Check status',
    pending: 'We received your request and are deleting your data.',
    done: 'Your data has been deleted.',
    unknown: 'We could not find a request with this code. Check that you typed it exactly as you received it.',
    missing: 'Enter a confirmation code to see the status of your request.',
    statusPending: 'In progress',
    statusDone: 'Completed',
    statusUnknown: 'Not found',
    back: 'Data deletion instructions',
  },
  notFound: {
    body: 'There is no page at this address. It may have moved, or the link may be mistyped.',
    home: 'Go to the home page',
  },
  footer: {
    about: 'Answers about Instagram shop pages, from published reviews, in your Instagram inbox.',
    contact: 'Contact',
    legal: 'Legal',
    rights: 'Trust Me is operated by {company}. Not affiliated with Meta or Instagram.',
  },
};
