import { useBulbStore } from '@renderer/context/BulbStore'
import { useTranslation } from 'react-i18next'
import { LuCpu } from 'react-icons/lu'

export default function Information() {
  const bulb = useBulbStore((state) => state.activeBulb)
  const { t } = useTranslation()

  const renderLabel = (name: string, value: string | number) => (
    <p>
      <span className="font-medium me-2">{name}:</span>
      <span>{value}</span>
    </p>
  )

  const renderCardInfo = () => (
    <article className="mt-14 flex bg-secondary-700 rounded-xl px-6 py-5 flex-col w-fit shadow-lg">
      <div className="flex items-center gap-2">
        <LuCpu size={28} strokeWidth={1} />
        <h2 className="text-2xl lg:text-2xl font-semibold">{bulb.name}</h2>
      </div>

      <div className="mt-4 lg:text-lg leading-normal">
        {renderLabel(t('information.moduleName'), bulb.moduleName)}
        {renderLabel(t('information.ip'), bulb.ip)}
        {renderLabel(t('information.port'), bulb.port)}
        {renderLabel(t('information.mac'), bulb.mac)}
        {renderLabel(t('information.state'), bulb.state ? 'ON' : 'OFF')}
        {renderLabel(t('information.sceneId'), bulb.sceneId)}
        {renderLabel(t('information.firmwareVersion'), bulb.fwVersion)}
        {renderLabel(t('information.homeId'), bulb.homeId)}
        {renderLabel(t('information.roomId'), bulb.roomId)}
      </div>
    </article>
  )

  return (
    <section className="py-8 px-8">
      <h1 className="font-bold text-4xl">{t('information.title')}</h1>
      <h2 className="text-sm lg:text-lg mt-2 text-neutral-400 font-medium">
        {t('information.subtitle')}
      </h2>
      {bulb ? (
        renderCardInfo()
      ) : (
        <div className="flex flex-col gap-4 mt-14 rounded-xl py-5 w-fit text-neutral-400">
          <p className="my-12 text-center text-neutral-500 font-bold text-sm">
            {t('information.missing')}
          </p>
        </div>
      )}
    </section>
  )
}
