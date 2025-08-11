type Photo = { id: string; url: string; alt?: string | null }

export default function PhotoCarousel({ photos }: { photos: Photo[] }){
  if(!photos?.length) return null
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 snap-x snap-mandatory pb-2">
        {photos.map(p => (
          <img key={p.id} src={p.url} alt={p.alt || 'Photo'} className="h-40 w-auto rounded-2xl object-cover snap-start" loading="lazy" />
        ))}
      </div>
    </div>
  )
}
