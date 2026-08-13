export type EspaceTeamBrand = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  brandColor: string | null
}

export function useEspaceTeamBrand() {
  const brand = useState<EspaceTeamBrand | null>('espace-team-brand', () => null)

  function setBrand(next: EspaceTeamBrand | null) {
    brand.value = next
  }

  function setFromTeam(team: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    brandColor: string | null
  }) {
    brand.value = {
      id: team.id,
      name: team.name,
      slug: team.slug,
      logoUrl: team.logoUrl,
      brandColor: team.brandColor,
    }
  }

  return { brand, setBrand, setFromTeam }
}
