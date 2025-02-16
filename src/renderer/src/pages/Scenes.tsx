import Scene from '@renderer/components/Scene'
import useDebounce from '@renderer/hooks/useDebounce'
import { useState } from 'react'
import { LuX } from 'react-icons/lu'

export default function Scenes() {
  // TODO: Debounce value
  const [searchValue, setSearchValue] = useState('')
  const [notFoundMessage, setNotFoundMessage] = useState('')
  const debouncedSearch = useDebounce(searchValue, 500)

  const [selectedTag, setSelectedTag] = useState('All')

  const handleResetNotFound = () => {
    if (notFoundMessage.length > 0) {
      setNotFoundMessage('')
    }
  }

  const handleChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleResetNotFound()
    setSearchValue(e.target.value)
  }

  const handleResetSearch = () => {
    handleResetNotFound()
    setSearchValue('')
  }

  const handleChangeTag = (name: string) => {
    setSearchValue('')
    handleResetNotFound()
    setSelectedTag(name)
  }

  const renderTagButton = (name: string) => (
    <button
      key={name}
      className={`text-white text-sm lg:text-base px-3 py-1 rounded-full cursor-pointer  transition-colors ${selectedTag === name ? 'bg-primary hover:bg-primary-600' : 'bg-secondary hover:bg-secondary-600'}`}
      onClick={() => handleChangeTag(name)}
    >
      {name}
    </button>
  )

  const areScenesEmpty = notFoundMessage.length > 0

  const renderScenes = () => {
    if (selectedTag === 'All') {
      return <Scene nameFilter={debouncedSearch} onEmpty={(msg) => setNotFoundMessage(msg)} />
    } else if (selectedTag === 'Static') {
      return (
        <Scene
          type="static"
          nameFilter={debouncedSearch}
          onEmpty={(msg) => setNotFoundMessage(msg)}
        />
      )
    } else if (selectedTag === 'Dynamic') {
      return (
        <Scene
          type="dynamic"
          nameFilter={debouncedSearch}
          onEmpty={(msg) => setNotFoundMessage(msg)}
        />
      )
    } else if (selectedTag === 'Custom') {
      return (
        <Scene
          type="custom"
          nameFilter={debouncedSearch}
          onEmpty={(msg) => setNotFoundMessage(msg)}
        />
      )
    }

    return null
  }

  return (
    <section className="py-8 px-8 w-full">
      <h1 className="font-bold text-4xl">Scenes</h1>
      <article className="mt-8 w-full">
        <h2 className="text-2xl font-semibold">Favorites</h2>
        <p className="my-12 text-center text-neutral-500 font-bold text-sm">
          You haven't selected any favorite scene yet, try selecting one
        </p>
      </article>

      <article className="mt-8 w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Available</h2>
          <div className="relative">
            <input
              type="search"
              value={searchValue}
              onChange={handleChangeSearch}
              placeholder="Search scenes"
              className="bg-secondary-700 text-white ps-4 py-1 rounded-4xl placeholder:text-neutral-500 font-[450] placeholder:text-sm focus:outline-none focus:border-primary focus:border-2 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchValue && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
                onClick={handleResetSearch}
              >
                <LuX size={20} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {renderTagButton('All')}
          {renderTagButton('Static')}
          {renderTagButton('Dynamic')}
          {renderTagButton('Custom')}
        </div>
      </article>

      <article className="mt-8 w-full grid grid-cols-3 gap-x-4 gap-y-4 lg:gap-y-6 lg:grid-cols-4 xl:grid-cols-5">
        {renderScenes()}
      </article>
      {areScenesEmpty && (
        <p className="mt-8 text-center text-neutral-500 font-bold text-sm">{notFoundMessage}</p>
      )}
    </section>
  )
}
