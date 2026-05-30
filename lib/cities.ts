export type CityKey =
  | 'sharjah'
  | 'ajman'
  | 'dubai'
  | 'abu_dhabi'
  | 'ras_al_khaimah'
  | 'fujairah'
  | 'umm_al_quwain'
  | 'al_ain';

export type City = {
  key: CityKey;
  nameAr: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  searchText: string;
};

export const cities: City[] = [
  {
    key: 'sharjah',
    nameAr: 'الشارقة',
    nameEn: 'Sharjah',
    latitude: 25.3463,
    longitude: 55.4209,
    searchText: 'Sharjah UAE',
  },
  {
    key: 'ajman',
    nameAr: 'عجمان',
    nameEn: 'Ajman',
    latitude: 25.4052,
    longitude: 55.5136,
    searchText: 'Ajman UAE',
  },
  {
    key: 'dubai',
    nameAr: 'دبي',
    nameEn: 'Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    searchText: 'Dubai UAE',
  },
  {
    key: 'abu_dhabi',
    nameAr: 'أبوظبي',
    nameEn: 'Abu Dhabi',
    latitude: 24.4539,
    longitude: 54.3773,
    searchText: 'Abu Dhabi UAE',
  },
  {
    key: 'ras_al_khaimah',
    nameAr: 'رأس الخيمة',
    nameEn: 'Ras Al Khaimah',
    latitude: 25.8007,
    longitude: 55.9762,
    searchText: 'Ras Al Khaimah UAE',
  },
  {
    key: 'fujairah',
    nameAr: 'الفجيرة',
    nameEn: 'Fujairah',
    latitude: 25.1288,
    longitude: 56.3265,
    searchText: 'Fujairah UAE',
  },
  {
    key: 'umm_al_quwain',
    nameAr: 'أم القيوين',
    nameEn: 'Umm Al Quwain',
    latitude: 25.5647,
    longitude: 55.5552,
    searchText: 'Umm Al Quwain UAE',
  },
  {
    key: 'al_ain',
    nameAr: 'العين',
    nameEn: 'Al Ain',
    latitude: 24.1302,
    longitude: 55.8023,
    searchText: 'Al Ain UAE',
  },
];

export function getCityByKey(key?: string) {
  return cities.find((city) => city.key === key) ?? cities[0];
}