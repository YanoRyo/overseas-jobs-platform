export const mentorProfilePhotos = {
  kenSato: {
    alt: "Ken Sato profile photo",
    src: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  minaLee: {
    alt: "Mina Lee profile photo",
    src: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  danielPark: {
    alt: "Daniel Park profile photo",
    src: "https://randomuser.me/api/portraits/men/51.jpg",
  },
  rahulSharma: {
    alt: "Rahul Sharma profile photo",
    src: "https://randomuser.me/api/portraits/men/75.jpg",
  },
} as const;

const mentorProfilePhotoFallbacks = [
  mentorProfilePhotos.kenSato,
  mentorProfilePhotos.minaLee,
  mentorProfilePhotos.danielPark,
  mentorProfilePhotos.rahulSharma,
] as const;

export function getMentorProfilePhoto(seed: string) {
  const hash = Array.from(seed).reduce(
    (total, char) => total + char.charCodeAt(0),
    0
  );

  return mentorProfilePhotoFallbacks[
    hash % mentorProfilePhotoFallbacks.length
  ];
}
