import Card from '@components/ui/Card'
import { useTranslation } from 'react-i18next'
import { LuLoaderCircle } from 'react-icons/lu'

export default function SearchBulbCard() {
  const { t } = useTranslation()
  return (
    <Card className="w-full h-31 flex flex-col items-center justify-center py-3 px-4">
      <span className="animate-spin-clockwise animate-iteration-count-infinite animate-steps-modern animate-duration-800">
        <LuLoaderCircle size={36} />
      </span>
      <p className="mt-2 text-lg">{t('home.search')}</p>
    </Card>
  )
}
