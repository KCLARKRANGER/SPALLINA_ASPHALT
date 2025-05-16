// Define crew members with their rates
export const crewMembers = [
  { id: "matt", name: "Matt Shay", title: "Foreman", rate: 38, overtimeRate: 57 },
  { id: "cole", name: "Cole", title: "Operator", rate: 30, overtimeRate: 45 },
  { id: "bryan", name: "Bryan", title: "Screedman", rate: 28, overtimeRate: 42 },
  { id: "dean", name: "Dean", title: "Screedman", rate: 29, overtimeRate: 43.5 },
  { id: "adam", name: "Adam", title: "Operator", rate: 25, overtimeRate: 37.5 },
  { id: "holden", name: "Holden", title: "Laborer", rate: 24, overtimeRate: 36 },
  { id: "craig", name: "Craig", title: "Laborer", rate: 20, overtimeRate: 30 },
  { id: "dustin", name: "Dustin", title: "Operator", rate: 35, overtimeRate: 52.5 },
  { id: "jordan", name: "Jordan", title: "Operator", rate: 30, overtimeRate: 45 },
  { id: "jesse", name: "Jesse", title: "Operator", rate: 25, overtimeRate: 37.5 },
]

// Get unique job titles from crew members
export const jobTitles = Array.from(new Set(crewMembers.map((member) => member.title)))

// Get crew members by title
export const getCrewMembersByTitle = (title: string) => {
  return crewMembers.filter((member) => member.title === title)
}

// Get crew member by ID
export const getCrewMemberById = (id: string) => {
  return crewMembers.find((member) => member.id === id)
}
