import { baseApi } from '../api/baseApi';

export const galleryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGallery: builder.query({
      query: () => '/api/gallery',
      providesTags: ['Gallery'],
    }),
    uploadToGallery: builder.mutation({
      query: (formData) => ({
        url: '/api/gallery',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Gallery'],
    }),
    deleteFromGallery: builder.mutation({
      query: (id) => ({
        url: `/api/gallery/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Gallery'],
    }),
  }),
});

export const {
  useGetGalleryQuery,
  useUploadToGalleryMutation,
  useDeleteFromGalleryMutation,
} = galleryApi;
