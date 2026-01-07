export interface Filter {
  id: string;
  name: string;
  prompt: string;
}

export interface GalleryItem {
  id: string;
  userId: string;
  originalImage: string;
  resultImage: string;
  filterName: string;
  filterId: string;
  isFavorite: boolean;
  createdAt: Date;
}
