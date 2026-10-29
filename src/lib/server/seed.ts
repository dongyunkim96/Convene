import { details } from './session-content.ts';
import type { DB } from './db.ts';
import { one, transaction } from './db.ts';
import { addUser, hash } from './auth.ts';
import { book } from './domain.ts';
import { tracks } from '../event.ts';
export function seed(db: DB) {
  if (one(db, 'SELECT id FROM events LIMIT 1')) {
    transaction(db, () =>
      details.forEach((d, i) =>
        db
          .prepare('UPDATE sessions SET description=?,outcomes=? WHERE id=?')
          .run(d[0], JSON.stringify(d[1]), i + 1),
      ),
    );
    return;
  }
  transaction(db, () => {
    db.prepare('INSERT INTO events VALUES(1,?,?,?,?)').run(
      'CONVENE',
      'America/New_York',
      '2027-05-20T13:00:00Z',
      '2027-05-21T21:00:00Z',
    );
    const people = [
      ['Maya Chen', 'Staff Engineer', 'Northstar', 'MC', '#ddd8ef'],
      ['Jordan Ellis', 'AI Research Lead', 'Fieldwork', 'JE', '#d7e8df'],
      ['Amara Okafor', 'Design Director', 'Common Ground', 'AO', '#efddc9'],
      ['Noah Park', 'VP of Engineering', 'Waypoint', 'NP', '#d8e5ed'],
      ['Sofia Reyes', 'Platform Architect', 'Threadline', 'SR', '#e9d8d8'],
      ['Ethan Brooks', 'Data Engineer', 'Signal House', 'EB', '#dedec9'],
      ['Priya Nair', 'Product Strategist', 'Form & Function', 'PN', '#dddef2'],
      ['Leo Martin', 'Engineering Manager', 'Kindred', 'LM', '#d5e6e0'],
      ['Isla Thompson', 'Security Engineer', 'Openframe', 'IT', '#e7dcef'],
      ['Owen Rivera', 'ML Engineer', 'Lucent Labs', 'OR', '#e5dfd2'],
      ['Zara Ahmed', 'Accessibility Lead', 'Civic Studio', 'ZA', '#d3e4e9'],
      ['Theo Bennett', 'Founder', 'Small Hours', 'TB', '#edddce'],
    ];
    people.forEach((p, i) =>
      db
        .prepare('INSERT INTO speakers VALUES(?,?,?,?,?,?,?)')
        .run(
          i + 1,
          p[0],
          p[1],
          p[2],
          `${p[0]} works at the intersection of thoughtful technology and practical change. As ${p[1].toLowerCase()} at ${p[2]}, they help teams turn ambitious ideas into reliable products. Their sessions draw on hands-on experience and leave space for honest questions.`,
          p[3],
          p[4],
        ),
    );
    const titles = [
      'Building software that lasts',
      'Beyond the AI prototype',
      'Designing for the in-between',
      'Leading teams through uncertainty',
      'The modern platform playbook',
      'Your data deserves better',
      'From research to real decisions',
      'A better kind of engineering culture',
      'Security is a product feature',
      'Evaluating AI in the real world',
      'Accessibility from the first sketch',
      'The small team advantage',
      'Resilient systems, human teams',
      'Retrieval without the guesswork',
      'The craft of useful interfaces',
      'Feedback that moves work forward',
      'Shipping faster with less complexity',
      'From messy data to clear signals',
      'Design systems that people use',
      'Growing engineers, not just teams',
      'A practical guide to observability',
      'Responsible AI by design',
      'Inclusive products, stronger outcomes',
      'What we build next',
    ];
    const rooms = ['The Assembly', 'Studio A', 'Studio B', 'The Workshop'];
    titles.forEach((title, i) => {
      const index = i % 12;
      const slot = Math.floor(index / 4);
      const startHour = [9, 11, 14][slot];
      const date = 20 + Math.floor(i / 12);
      const minute = index === 1 ? 30 : 0;
      const start = new Date(Date.UTC(2027, 4, date, startHour + 4, minute));
      const end = new Date(+start + [45, 60, 90][i % 3] * 60000);
      const track = tracks[i % 4];
      db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
        i + 1,
        1,
        title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-'),
        title,
        details[i][0],
        JSON.stringify(details[i][1]),
        track,
        `${track},practice,systems`,
        start.toISOString(),
        end.toISOString(),
        rooms[i % 4],
        i % 3 === 2 ? 'Workshop' : 'Talk',
        i % 3 === 0 ? 'Foundational' : i % 3 === 1 ? 'Intermediate' : 'Advanced',
        i === 5 ? 1 : i === 9 ? 2 : 40 + (i % 4) * 20,
        i === 11 || i === 23 ? 'vip' : 'all',
      );
      db.prepare('INSERT INTO session_speakers VALUES(?,?)').run(i + 1, (i % 12) + 1);
    });
    db.prepare('INSERT INTO invitations VALUES(?,?)').run(hash('CONVENE-VIP'), 'vip');
    db.prepare('INSERT INTO invitations VALUES(?,?)').run(hash('CONVENE-SPEAKER'), 'speaker');
  });
  const general = addUser(db, {
    name: 'Alex Morgan',
    email: 'alex@convene.demo',
    password: 'Convene2027!',
    category: 'general',
    company: 'Independent',
    interests: 'Engineering',
  });
  addUser(db, {
    name: 'Sam Taylor',
    email: 'vip@convene.demo',
    password: 'Convene2027!',
    category: 'vip',
  });
  addUser(db, {
    name: 'Maya Chen',
    email: 'speaker@convene.demo',
    password: 'Convene2027!',
    category: 'speaker',
  });
  addUser(db, {
    name: 'Jamie Quinn',
    email: 'organizer@convene.demo',
    password: 'Convene2027!',
    category: 'general',
    role: 'organizer',
  });
  const holder = addUser(db, {
    name: 'Casey Lee',
    email: 'casey@convene.demo',
    password: 'Convene2027!',
    category: 'general',
  });
  book(db, holder, 6);
  book(db, general, 1);
}
