// Mock data for MVP demo
export const mockIdols = [
  { id: 1, name: '周杰伦', avatar: 'https://picsum.photos/seed/jay/100/100' },
  { id: 2, name: 'Taylor Swift', avatar: 'https://picsum.photos/seed/taylor/100/100' },
  { id: 3, name: 'BTS', avatar: 'https://picsum.photos/seed/bts/100/100' },
]

export const mockEvents = [
  {
    id: 1,
    idolId: 1,
    idolName: '周杰伦',
    title: '嘉年华世界巡回演唱会-北京站',
    date: '2026-06-15T19:30:00+08:00',
    location: '北京工人体育场',
    lat: 39.9304,
    lng: 116.4437,
    photos: ['https://picsum.photos/seed/e1/200/200'],
  },
  {
    id: 2,
    idolId: 2,
    idolName: 'Taylor Swift',
    title: 'The Eras Tour - Shanghai',
    date: '2026-07-20T19:00:00+08:00',
    location: '上海体育场',
    lat: 31.1827,
    lng: 121.4468,
    photos: [],
  },
  {
    id: 3,
    idolId: 3,
    idolName: 'BTS',
    title: '粉丝见面会',
    date: '2026-05-25T14:00:00+08:00',
    location: '深圳湾体育中心',
    lat: 22.5178,
    lng: 113.9486,
    photos: ['https://picsum.photos/seed/e3/200/200', 'https://picsum.photos/seed/e3b/200/200'],
  },
  {
    id: 4,
    idolId: 1,
    idolName: '周杰伦',
    title: '新专辑签售会',
    date: '2025-12-01T10:00:00+08:00',
    location: '广州天河体育馆',
    lat: 23.1391,
    lng: 113.3284,
    photos: [],
  },
]
