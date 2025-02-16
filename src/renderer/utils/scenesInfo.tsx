import { BsFillSunsetFill, BsSunFill, BsSunriseFill } from 'react-icons/bs'
import {
  FaBed,
  FaCanadianMapleLeaf,
  FaCandyCane,
  FaCouch,
  FaGlasses,
  FaHeart,
  FaMartiniGlass,
  FaMoon,
  FaMugHot,
  FaPalette,
  FaSnowflake,
  FaTv
} from 'react-icons/fa6'
import { GiCandleHolder, GiHighGrass, GiPalmTree, GiSteampunkGoggles } from 'react-icons/gi'
import { HiColorSwatch } from 'react-icons/hi'
import { IoMdMicrophone } from 'react-icons/io'
import { IoFish } from 'react-icons/io5'
import { LuPartyPopper } from 'react-icons/lu'
import { MdForest, MdSunny, MdWaves } from 'react-icons/md'
import { PiFlowerLotusBold, PiTreeFill } from 'react-icons/pi'
import { RiGhostFill, RiPlantFill, RiPulseFill } from 'react-icons/ri'
import { TbCampfireFilled } from 'react-icons/tb'

type Scene = {
  id: number
  name: string
  icon: React.ReactNode
  type: 'static' | 'dynamic' | 'custom'
}

const ICON_SIZE = 24

export const scenes: Scene[] = [
  {
    id: 11,
    name: 'Warm White',
    icon: <FaMugHot size={ICON_SIZE} />,
    type: 'static'
  },
  {
    id: 12,
    name: 'Day Light',
    icon: <BsSunFill size={ICON_SIZE} />,
    type: 'static'
  },
  {
    id: 13,
    name: 'Cold White',
    icon: <FaSnowflake size={ICON_SIZE} />,
    type: 'static'
  },
  {
    id: 14,
    name: 'Night Light',
    icon: <FaMoon size={ICON_SIZE} />,
    type: 'static'
  },
  {
    id: 6,
    name: 'Cozy',
    icon: <FaCouch size={ICON_SIZE} />,
    type: 'static'
  },
  {
    id: 17,
    name: 'True Colors',
    icon: <FaPalette size={ICON_SIZE} />,
    type: 'static'
  },
  {
    id: 16,
    name: 'Relax',
    icon: <PiFlowerLotusBold size={ICON_SIZE} />,
    type: 'static'
  },
  {
    id: 15,
    name: 'Focus',
    icon: <FaGlasses size={ICON_SIZE} />,
    type: 'static'
  },
  {
    id: 18,
    name: 'TV Time',
    icon: <FaTv size={ICON_SIZE} />,
    type: 'static'
  },
  {
    id: 19,
    name: 'Plant Growth',
    icon: <RiPlantFill size={ICON_SIZE} />,
    type: 'static'
  },
  {
    id: 29,
    name: 'Candle Light',
    icon: <GiCandleHolder size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 31,
    name: 'Pulse',
    icon: <RiPulseFill size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 30,
    name: 'Golden White',
    icon: <MdSunny size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 32,
    name: 'Steampunk',
    icon: <GiSteampunkGoggles size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 5,
    name: 'Fireplace',
    icon: <TbCampfireFilled size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 22,
    name: 'Fall',
    icon: <FaCanadianMapleLeaf size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 26,
    name: 'Club',
    icon: <IoMdMicrophone size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 3,
    name: 'Sunset',
    icon: <BsFillSunsetFill size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 2,
    name: 'Romance',
    icon: <FaHeart size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 4,
    name: 'Party',
    icon: <LuPartyPopper size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 8,
    name: 'Pastel Colors',
    icon: <HiColorSwatch size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 20,
    name: 'Spring',
    icon: <PiTreeFill size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 21,
    name: 'Summer',
    icon: <GiPalmTree size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 7,
    name: 'Forest',
    icon: <MdForest size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 24,
    name: 'Jungle',
    icon: <GiHighGrass size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 25,
    name: 'Mojito',
    icon: <FaMartiniGlass size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 1,
    name: 'Ocean',
    icon: <MdWaves size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 23,
    name: 'Deep Dive',
    icon: <IoFish size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 27,
    name: 'Christmas',
    icon: <FaCandyCane size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 28,
    name: 'Halloween',
    icon: <RiGhostFill size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 10,
    name: 'Bedtime',
    icon: <FaBed size={ICON_SIZE} />,
    type: 'dynamic'
  },
  {
    id: 9,
    name: 'Wake Up',
    icon: <BsSunriseFill size={ICON_SIZE} />,
    type: 'dynamic'
  }
]
