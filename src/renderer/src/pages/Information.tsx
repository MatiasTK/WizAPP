import { useBulbStore } from '@renderer/context/BulbStore'
import { LuLightbulb } from 'react-icons/lu'

export default function Information() {
  const bulb = useBulbStore((state) => state.bulb)

  const renderLabel = (name: string, value: string | number) => (
    <p>
      <span className="font-medium me-2">{name}:</span>
      <span>{value}</span>
    </p>
  )

  const renderCardInfo = () => (
    <article className="mt-14 flex bg-secondary-700 rounded-xl px-6 py-5 flex-col w-fit shadow-lg">
      <div className="flex items-center gap-4">
        <LuLightbulb size={36} strokeWidth={1} />
        <h2 className="text-2xl font-semibold">Bedroom</h2>
      </div>

      <div className="mt-4 text-lg leading-normal">
        {renderLabel('Module Name', bulb.moduleName)}
        {renderLabel('IP Address', bulb.ip)}
        {renderLabel('Port', bulb.port)}
        {renderLabel('MAC Direction', bulb.mac)}
        {renderLabel('State', bulb.state ? 'ON' : 'OFF')}
        {renderLabel('Scene ID', bulb.sceneId)}
        {renderLabel('Firmware Version', bulb.fwVersion)}
        {renderLabel('Home ID', bulb.homeId)}
        {renderLabel('Room ID', bulb.roomId)}
      </div>
    </article>
  )

  return (
    <section className="py-8 px-8">
      <h1 className="font-bold text-4xl">Information</h1>
      {bulb && renderCardInfo()}
    </section>
  )
}
