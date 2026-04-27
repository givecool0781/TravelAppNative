import type { Trip } from '../types'

export const mockTrips: Trip[] = [
  {
    id: 'trip-tokyo-demo',
    name: '東京 3 日遊',
    destination: '東京',
    country: '日本',
    startDate: '2025-03-20',
    endDate: '2025-03-22',
    emoji: '🗼',
    days: [
      {
        id: 'day-t1',
        date: '2025-03-20',
        events: [
          {
            id: 'ev-t1',
            time: '09:00',
            title: '淺草寺',
            category: 'attraction',
            location: { lat: 35.7148, lng: 139.7967, address: '東京都台東區淺草 2-3-1' },
            notes: '東京最古老的寺廟，雷門拍照必去',
            duration: '1.5 小時',
          },
          {
            id: 'ev-t2',
            time: '12:30',
            title: '壽司大',
            category: 'food',
            location: { lat: 35.6654, lng: 139.7707, address: '東京都江東區豐洲 6-5-1' },
            notes: '豐洲市場內，新鮮食材',
            duration: '1 小時',
          },
          {
            id: 'ev-t3',
            time: '15:00',
            title: '晴空塔',
            category: 'attraction',
            location: { lat: 35.7101, lng: 139.8107, address: '東京都墨田區押上 1-1-2' },
            duration: '2 小時',
          },
        ],
      },
      {
        id: 'day-t2',
        date: '2025-03-21',
        events: [
          {
            id: 'ev-t4',
            time: '08:30',
            title: 'N\'EX 成田特快',
            category: 'transport',
            location: { lat: 35.6812, lng: 139.7671, address: '東京駅' },
            duration: '53 分鐘',
          },
          {
            id: 'ev-t5',
            time: '14:00',
            title: '新宿御苑',
            category: 'attraction',
            location: { lat: 35.685, lng: 139.71, address: '東京都新宿區內藤町 11' },
            duration: '2 小時',
          },
        ],
      },
      { id: 'day-t3', date: '2025-03-22', events: [] },
    ],
  },
]
